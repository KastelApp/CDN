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
import type { Request, Response } from "express";
import Mime from "mime-types";
import User from "@/Middleware/User.ts";
import type App from "@/Utils/Classes/App";
import Encryption from "@/Utils/Classes/Encryption.ts";
import ErrorGen from "@/Utils/Classes/ErrorGen.ts";
import Route from "@/Utils/Classes/Route.ts";
import T from "@/Utils/TypeCheck.ts";

interface UploadBody {
	FileName: string;
	FileSize: number;
}

export default class Main extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ["POST"];

		this.Middleware = [
			User({
				App,
				AccessType: "LoggedIn",
				AllowedRequesters: "All",
				DisallowedFlags: []
			})
		];

		this.AllowedContentTypes = [];

		this.Routes = ["/upload"];
	}

	public override async Request(Req: Request<any, any, UploadBody>, Res: Response): Promise<void> {
		const PutUser = this.App.Config.S3.Users.find((User) => User.Type === "Guild" && User.Permissions.some((Permission) => Permission === "Upload" || Permission === "All"));

		if (!PutUser) {
			Res.status(500).send("Internal Server Error :(");

			this.App.Logger.error("No user found with permissions to upload files to the guild bucket.");

			return;
		}
		
		const Invalidrequest = ErrorGen.InvalidField();
		
		if (!T(Req.body.FileName, "string")) {
			Invalidrequest.AddError({
				FileName: {
					Code: "InvalidType",
					Message: "The FileName field must be a string."
				}
			});
		}
		
		if (!T(Req.body.FileSize, "number")) {
			Invalidrequest.AddError({
				FileSize: {
					Code: "InvalidType",
					Message: "The FileSize field must be a number."
				}
			});
		}
		
		if (Object.keys(Invalidrequest.Errors).length > 0) {
			Res.status(400).send(Invalidrequest.toJSON());

			return;
		}
		
		if (Req.body.FileSize > Req.user.MaxFileSize) {
			const Error = ErrorGen.FileTooLarge();

			Error.AddError({
				File: {
					Code: "FileTooLarge",
					Message: "The file you are trying to upload is above the maximum file size allowed for your account."
				}
			});

			Res.status(400).send(Error.toJSON());

			return;
		}

		const Id = this.App.Snowflake.Generate();
		
		const Client = new S3Client({
			region: this.App.Config.S3.Region,
			credentials: {
				accessKeyId: PutUser.AcessKey,
				secretAccessKey: PutUser.SecretKey
			}
		});
		
		const Command = new PutObjectCommand({
			Bucket: PutUser.Bucket,
			Key: `guilds/${Id}`,
		});
		
		const SignedUrl = await getSignedUrl(Client, Command, {
			expiresIn: 3_600, // 1 hour
		});
		
		const Expires = Date.now() + 2_700_000; // 45 minutes
		const SafeFileName = encodeURIComponent(Req.body.FileName);
		const Key = Encryption.Encrypt(`${Id}-${SafeFileName}`);
		
		this.App.PreSignedUrls.set(
			Id,
			{
				Key,
				Expires,
				Url: SignedUrl,
				// Sha256 is the hash of the Encrypted Id and FileName & the expiration date
				Sha256: Encryption.SignedSha256(`${Id}-${Key}-${Expires}`)
			}
		)
		
		const Url = `${this.App.Config.Server.Secure ? "https" : "http"}://${this.App.Config.Server.Forwarder.Domain}/g/${Id}/${SafeFileName}?k=${Key}&ex=${Expires}&s=${Encryption.SignedSha256(`${Id}-${Key}-${Expires}`)}`;
		
		await this.App.Cassandra.Models.File.insert({
			Deleted: false,
			FileId: Encryption.Encrypt(Id),
			Name: Encryption.Encrypt(Req.body.FileName),
			Uploaded: false, // every day we will purge any non uploaded files
			UploadedAt: new Date(),
			Type: (Mime.lookup(Req.body.FileName) ? Mime.lookup(Req.body.FileName) : "text/plain") as string,
			UploadedBy: Encryption.Encrypt(Req.user.Id),
			Hash: null,
			ForId: null
		})
		
		Res.status(200).json({
			Url,
			Id,
			Expires
		})
	}
}
