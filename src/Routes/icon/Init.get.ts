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
import Mime from "mime-types";
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

		this.Route = "/:iconId/:hash/init"
	}

	public override async Request({ set, params, headers, query }: CreateRoute<"/:iconId/:hash/init", any>) {
        const SecretHeader = headers.authorization;
		
		if (!SecretHeader) {
            set.status = 500;
            
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
		
		if (Number(query.ex) < Date.now()) { // Expired
			const Error = ErrorGen.FileExpired();
			
			Error.AddError({
				Ex: {
					Code: "FileExpired",
					Message: "The pre-signed url you are trying to use has expired."
				}
			});
			
            set.status = 400;
            
            return Error.toJSON();
		}
		
		const Key = query.k;
		const Signature = query.s;
		const Expiry = query.ex;
        const Hash = params.hash;
        const Type = query.type;
        
		const FoundUrl = this.App.PreSignedUrls.get(params.iconId);
		
		if (!FoundUrl) {
			const Error = ErrorGen.NotFound();
			
			Error.AddError({
				Key: {
					Code: "FileNotFound",
					Message: "File was not found."
				}
			});
			
            set.status = 404;
            
            return Error.toJSON();
		}
		
		if (FoundUrl.Expires < Date.now()) {
			const Error = ErrorGen.FileExpired();
			
			Error.AddError({
				Ex: {
					Code: "FileExpired",
					Message: "The pre-signed url you are trying to use has expired."
				}
			});
			
            set.status = 400;
            
            return Error.toJSON();
		}
		
		const OurHash = Encryption.SignedSha256(`${params.iconId}-${Key}-${Expiry}`);
		
		if (OurHash !== Signature) {
			const Error = ErrorGen.UnAuthorized();
			
			Error.AddError({
				Sig: {
					Code: "InvalidSignature",
					Message: "The signature provided is invalid."
				}
			});
			
            set.status = 401;
            
            return Error.toJSON();
		}
		
		await this.App.Cassandra.Models.File.update({
			FileId: Encryption.Encrypt(params.iconId),
			Uploaded: true,
            Hash: Encryption.Encrypt(Hash),
            Type: Mime.lookup(Type as string) as string
		});
		
        this.App.PreSignedUrls.delete(params.iconId);
		
        set.status = 200;
        
        return {
            Url: FoundUrl.Url,
            Expires: FoundUrl.Expires
        };
	}
}
