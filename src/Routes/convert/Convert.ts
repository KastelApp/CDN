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
import type { Request, Response } from "express";
import sharp from "sharp";
import type App from "@/Utils/Classes/App";
import Route from "@/Utils/Classes/Route.ts";

interface Body {
    File: string;
    To: "jpg" | "png" | "webp";
}

export default class Main extends Route {
    public constructor(App: App) {
        super(App);

        this.Methods = ["POST"];

        this.Middleware = [
        ];

        this.AllowedContentTypes = [];

        this.Routes = ["/"];
        
        this.KillSwitched = true;
    }

    public override async Request(Req: Request<any, any, Body>, Res: Response) {
        const SecretHeader = Req.headers.authorization;
        
		if (!SecretHeader) {
            this.App.Logger.debug("No secret header");

			Res.status(500).send("Internal Server Error :(");

			return;
		}

		const BufferSecret = Buffer.from(SecretHeader);
		const OurSecret = Buffer.from(this.App.Config.Server.Forwarder.Secret);
		
		if (BufferSecret.length !== OurSecret.length) {
            this.App.Logger.debug("Secret length mismatch");
            
			Res.status(500).send("Internal Server Error :(");

			return;
		}
		
		if (!crypto.timingSafeEqual(BufferSecret, OurSecret)) {
            this.App.Logger.debug("Secret mismatch");
        
			Res.status(500).send("Internal Server Error :(");

			return;
		}

        const { File, To } = Req.body;
        
        const Image = sharp(Buffer.from(File, "base64"));
        
        switch (To) {
            case "jpg": {
                Image.jpeg();
                
                break;
            }
            
            case "png": {
                Image.png();
                
                break;
            }
            
            case "webp": {
                Image.webp();
                
                break;
            }
        }
        
        const buf = (await Image.toBuffer()).toString("base64");
        
        Res.json({
            File: buf
        })
    }
}
