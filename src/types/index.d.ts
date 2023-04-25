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

import { Cache } from "../Utils/Classes/Cache";
import { Snowflake } from "@kastelll/util";
import { Minio } from "./Utils/Minio";

declare global {
  namespace Express {
    interface Request {
      clientIp: string;
    }

    interface Application {
      cache: Cache;
      ready: boolean
      snowflake: Snowflake
      minio: Minio
    }
  }

//   declare process env vars
    namespace NodeJS {
        interface ProcessEnv {
            MinioEndpoint: string
            MinioPort: string
            MinioAccessKey: string
            MinioSecretKey: string
            MinioUseSSL: string
            MongoUri: string
            FileUploadLimit: string
        }
    }
}
