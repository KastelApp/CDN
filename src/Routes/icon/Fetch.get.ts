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

import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type App from "@/Utils/Classes/App";
import Encryption from "@/Utils/Classes/Encryption.ts";
import ErrorGen from "@/Utils/Classes/ErrorGen.ts";
import type { CreateRoute } from "@/Utils/Classes/Route.ts";
import Route from "@/Utils/Classes/Route.ts";


export default class Upload extends Route {
    public constructor(App: App) {
		super(App);

		this.Middleware = [];

		this.AllowedContentTypes = [];

		this.Route = "/:iconId/:hash"
	}

	public override async Request({ set, params, headers }: CreateRoute<"/:iconId/:hash", any>) {
        const SecretHeader = headers.authorization;
		const PutUser = this.App.Config.S3.Users.find((User) => User.Type === "User" && User.Permissions.some((Permission) => Permission === "Fetch" || Permission === "All"));
				
		if (!SecretHeader) {
            set.status = 500;
            
            return "Internal Server Error :(";
		}
		

		if (!PutUser) {
            set.status = 500;
            
			this.App.Logger.error("No user found with permissions to upload files to the guild bucket.");

			return "Internal Server Error :(";
		}
		
		const BufferSecret = Buffer.from(SecretHeader);
		const OurSecret = Buffer.from(this.App.Config.Server.Forwarder.Secret);
		
		if (BufferSecret.length !== OurSecret.length) {
            set.status = 500;

			return "Internal Server Error :(";
		}
		
		if (!crypto.timingSafeEqual(BufferSecret, OurSecret)) {
            set.status = 500;

			return "Internal Server Error :(";
		}

		let FoundUrl = this.App.PreSignedFetchedUrls.get(params.iconId);
		
		if (FoundUrl) this.App.Logger.debug("Cache hit, fetching from cache");
		
		if (!FoundUrl) {
			this.App.Logger.debug("Cache not hit, fetching from database")
			
			const Fetched = await this.App.Cassandra.Models.File.find({
                ForId: Encryption.Encrypt(params.iconId), // ForId is due to the fact "iconId" is a guild id OR a user id
			});
			
			const FetchedArray = Fetched.toArray();
			
			if (FetchedArray.length === 0) {
				const Error = ErrorGen.NotFound();
			
				this.App.Logger.debug("File not found in the database", params.iconId);
				
				Error.AddError({
					Key: {
						Code: "FileNotFound",
						Message: "File was not found."
					}
				});
				
                set.status = 404;
                
				return Error.toJSON();
			}
            
			const FoundHash = FetchedArray.find((File) => File.Hash && Encryption.Decrypt(File.Hash) === params.hash);
			
			if (!FoundHash) { // You must also know the file name to access it
				const Error = ErrorGen.NotFound();

				this.App.Logger.debug("User has avatars, but none match the hash", params.hash)
				
				Error.AddError({
					Key: {
						Code: "FileNotFound",
						Message: "File was not found."
					}
				});
				
                set.status = 404;

				return Error.toJSON();
			}
			
			const Expiry = Date.now() + 1_000 * 60 * 60 * 24 * 1; // 1 day expiry
			
			const Client = new S3Client({
				region: this.App.Config.S3.Region,
				credentials: {
					accessKeyId: PutUser.AcessKey,
					secretAccessKey: PutUser.SecretKey
				}
			});
	
			const Command = new GetObjectCommand({
				Bucket: PutUser.Bucket,
				Key: `icons/${Encryption.Decrypt(FoundHash.FileId)}`,
			});
            
			const SignedUrl = await getSignedUrl(Client, Command, {
				// 1 day expiry (in seconds)
				expiresIn: 60 * 60 * 24 * 1,
			});
			
			this.App.PreSignedFetchedUrls.set(params.iconId, {
				Url: SignedUrl,
				Expire: Expiry,
				Name: params.hash,
                Type: FoundHash.Type
			});
			
			FoundUrl = this.App.PreSignedFetchedUrls.get(params.iconId);
		}
        		
		if (FoundUrl?.Name !== params.hash) { // You must also know the file name to access it
			const Error = ErrorGen.NotFound();
			
			this.App.Logger.debug("File name doesn't match", params.hash, FoundUrl?.Name);
			
			Error.AddError({
				Key: {
					Code: "FileNotFound",
					Message: "File was not found."
				}
			});
			
            set.status = 404;
            
            return Error.toJSON();
		}
		
		if (FoundUrl.Expire < Date.now()) {
			const Error = ErrorGen.FileExpired();
			
			Error.AddError({
				Ex: {
					Code: "FileExpired",
					Message: "The pre-signed url you are trying to use has expired, please re-try the request."
				}
			});
			
            set.status = 209;

            this.App.PreSignedFetchedUrls.delete(params.iconId);
            
            return Error.toJSON();
		}
        
        set.status = 200;
        
        return {
            Url: FoundUrl.Url,
            Expires: FoundUrl.Expire,
            Type: FoundUrl.Type ?? "image/png"
        };
	}
}
