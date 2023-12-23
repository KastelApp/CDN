/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
	getSignedUrl,
} from "@aws-sdk/s3-request-presigner";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import User from "@/Middleware/User.ts";
import type App from "@/Utils/Classes/App";
import Encryption from "@/Utils/Classes/Encryption.ts";
import ErrorGen from "@/Utils/Classes/ErrorGen.ts";
import type { CreateRoute } from "@/Utils/Classes/Route.ts";
import Route from "@/Utils/Classes/Route.ts";
import T from "@/Utils/TypeCheck.ts";

interface UploadBody {
	FileSize: number;
    GuildId?: string;
}

export default class Upload extends Route {
    private readonly MaxIconSize: number;
	
    public constructor(App: App) {
		super(App);

		this.Middleware = [
			User({
				App,
				AccessType: "LoggedIn",
				AllowedRequesters: "All",
				DisallowedFlags: []
			})
		];

		this.AllowedContentTypes = [];

		this.Route = "/upload"
        
        // max icon size is 5MB's
        this.MaxIconSize = 1_024 * 5;
	}

	public override async Request({ set, user, body }: CreateRoute<"/upload", UploadBody, [UserMiddlewareType]>) {
		const PutUser = this.App.Config.S3.Users.find((User) => User.Type === "User" && User.Permissions.some((Permission) => Permission === "Upload" || Permission === "All"));

		if (!PutUser) {
			this.App.Logger.error("No user found with permissions to upload files to the guild bucket.");

            set.status = 500;
            
			return "Internal Server Error :(";
		}
		
		const Invalidrequest = ErrorGen.InvalidField();
		
		if (!T(body.FileSize, "number")) {
			Invalidrequest.AddError({
				FileSize: {
					Code: "InvalidType",
					Message: "The FileSize field must be a number."
				}
			});
		}
        
        if (body.GuildId && !T(body.GuildId, "string") || body.GuildId && !user.Guilds.includes(body.GuildId)) {
            Invalidrequest.AddError({
                GuildId: {
                    Code: "InvalidType",
                    Message: "The GuildId field must be a string."
                }
            });
        }
        
		
		if (Object.keys(Invalidrequest.Errors).length > 0) {
            set.status = 400;
            
            return Invalidrequest.toJSON();
		}
		
		if (body.FileSize > this.MaxIconSize) {
			const Error = ErrorGen.FileTooLarge();

			Error.AddError({
				File: {
					Code: "FileTooLarge",
					Message: "The file you are trying to upload is above the maximum file size allowed for your account."
				}
			});

            set.status = 400;
            
            return Error.toJSON();
		}

		const Id = this.App.Snowflake.Generate();
        const ForId = body.GuildId ?? user.Id;
		
		const Client = new S3Client({
			region: this.App.Config.S3.Region,
			credentials: {
				accessKeyId: PutUser.AcessKey,
				secretAccessKey: PutUser.SecretKey
			}
		});
		
		const Command = new PutObjectCommand({
			Bucket: PutUser.Bucket,
			Key: `icons/${Id}`,
		});
		
		const SignedUrl = await getSignedUrl(Client, Command, {
			expiresIn: 3_600, // 1 hour
		});
		
		const Expires = Date.now() + 2_700_000; // 45 minutes
		const Key = Encryption.Encrypt(`${Id}-${user.Id}`);
		
		this.App.PreSignedUrls.set(
			Id,
			{
				Key,
				Expires,
				Url: SignedUrl,
				// Sha256 is the hash of the Encrypted Id and FileName & the expiration date
				Sha256: Encryption.SignedSha256(`${Id}-${Key}-${Expires}`),
                UserId: user.Id
			}
		)
		
		const Url = `${this.App.Config.Server.Secure ? "https" : "http"}://${this.App.Config.Server.Forwarder.Domain}/u/${Id}?k=${Key}&ex=${Expires}&s=${Encryption.SignedSha256(`${Id}-${Key}-${Expires}`)}`;
		
		await this.App.Cassandra.Models.File.insert({
			Deleted: false,
			FileId: Encryption.Encrypt(Id),
			Name: Encryption.Encrypt(user.Id),
			Uploaded: false, // every day we will purge any non uploaded files
			UploadedAt: new Date(),
			Type: "text/plain",
			UploadedBy: Encryption.Encrypt(user.Id),
			Hash: null,
            ForId: Encryption.Encrypt(ForId)
		})
		
        
        set.status = 200;
        
        return {
            Url,
            Id,
            Expires
        }
	}
}
