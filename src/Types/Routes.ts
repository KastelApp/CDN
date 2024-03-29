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

import type { PrivateFlags } from "../Constants.ts";
import type App from "../Utils/Classes/App.ts";

export type Methods =
	| "ALL"
	| "all"
	| "DELETE"
	| "delete"
	| "GET"
	| "get"
	| "HEAD"
	| "head"
	| "OPTIONS"
	| "options"
	| "PATCH"
	| "patch"
	| "POST"
	| "post"
	| "PURGE"
	| "purge"
	| "PUT"
	| "put";

export interface UserMiddleware {
	// The flags required to access the endpoint (Default: null)
	// If you need to be logged in to access the endpoint
	AccessType: "All" | "LoggedIn" | "LoggedOut";
	AllowedRequesters: "All" | "Bot" | "User";
	// The flags that are not allowed to access the endpoint (Default: null)
	App: App;
	DisallowedFlags?: (keyof typeof PrivateFlags)[];
	// The type of user that can access the endpoint (Default: 'All')
	Flags?: (keyof typeof PrivateFlags)[];
}


type GetParam<T extends string> = T extends `${infer _}/${infer _2}:${infer Param}/${infer _3}`
	? Record<Param, string>
	: T extends `${infer _}:${infer Param}/${infer _2}`
	? Record<Param, string>
	: T extends `${infer _}/${infer _2}:${infer Param}`
	? Record<Param, string>
	: T extends `${infer _}:${infer Param}`
	? Record<Param, string>
	: {};

export type GetParams<T extends string> = GetParam<T> & (T extends `${infer _}/${infer Rest}` ? GetParams<Rest> : T extends `${infer _}:${infer Rest}` ? GetParams<Rest> : {});
