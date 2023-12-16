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
import type { Request, Response } from "express";
import Mime from "mime-types";
import type App from "@/Utils/Classes/App";
import Encryption from "@/Utils/Classes/Encryption.ts";
import ErrorGen from "@/Utils/Classes/ErrorGen.ts";
import Route from "@/Utils/Classes/Route.ts";

export default class Main extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ["GET", "DELETE"];

		this.Middleware = [];

		this.AllowedContentTypes = [];

		this.Routes = ["/", "/init", "/:fileName"];
	}

	public override async Request(Req: Request<any, any, any, {
		ex: string;
		k: string;
		s: string;
	}>, Res: Response) {
		switch (Req.methodi) {
			case "GET": {
				if (Req.path.endsWith("/init")) {
					await this.FetchFileInit(Req, Res);
				} else {
					await this.FetchFile(Req, Res);
				}
				
				break;
			}
			
			case "DELETE": {
				await this.DeleteFile(Req, Res);
				
				break;
			}
			
			default: {
				Req.fourohfourit();

				break;
			}
		}
	}
	
	public async FetchFile(Req: Request<{fileId: string; fileName: string}>, Res: Response) {
		const SecretHeader = Req.headers.authorization;
		const PutUser = this.App.Config.S3.Users.find((User) => User.Type === "Guild" && User.Permissions.some((Permission) => Permission === "Fetch" || Permission === "All"));
				
		if (!SecretHeader) {
			Res.status(500).send("Internal Server Error :(");

			return;
		}
		

		if (!PutUser) {
			Res.status(500).send("Internal Server Error :(");

			this.App.Logger.error("No user found with permissions to upload files to the guild bucket.");

			return;
		}
		
		const BufferSecret = Buffer.from(SecretHeader);
		const OurSecret = Buffer.from(this.App.Config.Server.Forwarder.Secret);
		
		if (BufferSecret.length !== OurSecret.length) {
			Res.status(500).send("Internal Server Error :(");

			return;
		}
		
		if (!crypto.timingSafeEqual(BufferSecret, OurSecret)) {
			Res.status(500).send("Internal Server Error :(");

			return;
		}

		let FoundUrl = this.App.PreSignedFetchedUrls.get(Req.params.fileId);
		
		if (FoundUrl) this.App.Logger.debug("Cache hit, fetching from cache");
		
		if (!FoundUrl) {
			this.App.Logger.debug("Cache not hit, fetching from database")
			
			const Fetched = await this.App.Cassandra.Models.File.get({
				FileId: Encryption.Encrypt(Req.params.fileId)
			});
			
			if (!Fetched) {
				const Error = ErrorGen.NotFound();
			
				this.App.Logger.debug("File not found in the database", Req.params.fileId);
				
				Error.AddError({
					Key: {
						Code: "FileNotFound",
						Message: "File was not found."
					}
				});
				
				Res.status(404).send(Error.toJSON());

				return;
			}
			
			if (Fetched.Name !== Encryption.Encrypt(Req.params.fileName)) { // You must also know the file name to access it
				const Error = ErrorGen.NotFound();
				
				this.App.Logger.debug("File name doesn't match", Req.params.fileName, Encryption.Decrypt(Fetched.Name));
				
				Error.AddError({
					Key: {
						Code: "FileNotFound",
						Message: "File was not found."
					}
				});
				
				Res.status(404).send(Error.toJSON());

				return;
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
				Key: `guilds/${Req.params.fileId}`,
			});
			
			const SignedUrl = await getSignedUrl(Client, Command, {
				// 1 day expiry (in seconds)
				expiresIn: 60 * 60 * 24 * 1,
			});
			
			this.App.PreSignedFetchedUrls.set(Req.params.fileId, {
				Url: SignedUrl,
				Expire: Expiry,
				Name: Req.params.fileName
			});
			
			FoundUrl = this.App.PreSignedFetchedUrls.get(Req.params.fileId);
		}
		
		if (FoundUrl?.Name !== Req.params.fileName) { // You must also know the file name to access it
			const Error = ErrorGen.NotFound();
			
			this.App.Logger.debug("File name doesn't match", Req.params.fileName, FoundUrl?.Name);
			
			Error.AddError({
				Key: {
					Code: "FileNotFound",
					Message: "File was not found."
				}
			});
			
			Res.status(404).send(Error.toJSON());

			return;
		}
		
		if (FoundUrl.Expire < Date.now()) {
			const Error = ErrorGen.FileExpired();
			
			Error.AddError({
				Ex: {
					Code: "FileExpired",
					Message: "The pre-signed url you are trying to use has expired, please re-try the request."
				}
			});
			
			Res.status(209).send(Error.toJSON());

			this.App.PreSignedFetchedUrls.delete(Req.params.fileId);
			
			return;
		}
		
		Res.status(200).send({
			Url: FoundUrl.Url,
			Expires: FoundUrl.Expire,
			Type: Mime.lookup(FoundUrl.Name)
		});
	}
	
	public async FetchFileInit(Req: Request<{
		fileId: string;
	}, any, any, {
		ex: string;
		k: string;
		s: string;
	}>, Res: Response) {
		const SecretHeader = Req.headers.authorization;
		
		if (!SecretHeader) {
			Res.status(500).send("Internal Server Error :(");

			return;
		}
		
		const BufferSecret = Buffer.from(SecretHeader);
		const OurSecret = Buffer.from(this.App.Config.Server.Forwarder.Secret);
		
		if (BufferSecret.length !== OurSecret.length) {
			Res.status(500).send("Internal Server Error :(");

			return;
		}
		
		if (!crypto.timingSafeEqual(BufferSecret, OurSecret)) {
			Res.status(500).send("Internal Server Error :(");

			return;
		}
		
		if (Number(Req.query.ex) < Date.now()) { // Expired
			const Error = ErrorGen.FileExpired();
			
			Error.AddError({
				Ex: {
					Code: "FileExpired",
					Message: "The pre-signed url you are trying to use has expired."
				}
			});
			
			Res.status(400).send(Error.toJSON());

			return;
		}
		
		const Key = Req.query.k;
		const Signature = Req.query.s;
		const Expiry = Req.query.ex;
		
		const FoundUrl = this.App.PreSignedUrls.get(Req.params.fileId);
		
		if (!FoundUrl) {
			const Error = ErrorGen.NotFound();
			
			Error.AddError({
				Key: {
					Code: "FileNotFound",
					Message: "File was not found."
				}
			});
			
			Res.status(404).send(Error.toJSON());

			return;
		}
		
		if (FoundUrl.Expires < Date.now()) {
			const Error = ErrorGen.FileExpired();
			
			Error.AddError({
				Ex: {
					Code: "FileExpired",
					Message: "The pre-signed url you are trying to use has expired."
				}
			});
			
			Res.status(400).send(Error.toJSON());

			return;
		}
		
		const OurHash = Encryption.SignedSha256(`${Req.params.fileId}-${Key}-${Expiry}`);
		
		if (OurHash !== Signature) {
			const Error = ErrorGen.UnAuthorized();
			
			Error.AddError({
				Sig: {
					Code: "InvalidSignature",
					Message: "The signature provided is invalid."
				}
			});
			
			Res.status(401).send(Error.toJSON());

			return;
		}
		
		await this.App.Cassandra.Models.File.update({
			FileId: Encryption.Encrypt(Req.params.fileId),
			Uploaded: true
		});
		
		this.App.PreSignedUrls.delete(Req.params.fileId);
		
		Res.status(200).send({
			Url: FoundUrl.Url,
			Expires: FoundUrl.Expires
		})
	}
	
	public async DeleteFile(Req: Request, Res: Response) {}
}
