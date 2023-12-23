import type { CookieOptions } from "elysia";
import type { Prettify } from "elysia/types";
import type { HTTPStatusName } from "elysia/utils";
import type { GetParams } from "@/Types/Routes.ts";
import type App from "./App";

type Method = "all" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put";

type ContentTypes =
	| "application/javascript"
	| "application/json"
	| "application/octet-stream"
	| "application/pdf"
	| "application/vnd.ms-excel"
	| "application/vnd.ms-fontobject"
	| "application/vnd.ms-powerpoint"
	| "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	| "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	| "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	| "application/x-7z-compressed"
	| "application/x-apple-diskimage"
	| "application/x-bzip2"
	| "application/x-font-ttf"
	| "application/x-rar-compressed"
	| "application/x-shockwave-flash"
	| "application/x-tar"
	| "application/x-www-form-urlencoded"
	| "application/xml"
	| "application/zip"
	| "audio/mpeg"
	| "audio/ogg"
	| "audio/wav"
	| "audio/webm"
	| "font/eot"
	| "font/otf"
	| "font/ttf"
	| "font/woff"
	| "font/woff2"
	| "image/gif"
	| "image/jpeg"
	| "image/png"
	| "image/svg+xml"
	| "image/webp"
	| "image/x-icon"
	| "multipart/form-data"
	| "text/html"
	| "text/plain"
	| "text/xml"
	| "video/mp4"
	| "video/ogg"
	| "video/quicktime"
	| "video/webm"
	| "video/x-flv"
	| "video/x-matroska"
	| "video/x-ms-wmv"
	| "video/x-msvideo";


type CreateMiddleware<ExtraOptions extends Record<string, any> | string = Record<string, any>> = ExtraOptions;

interface CreateRouteOptions<Route extends string, Body extends Record<string, boolean | number | string | null | undefined> | unknown = unknown> {
	app: App;
	body: Body;
	headers: Record<string, string | null>;
	params: GetParams<Route>;
	path: Route;
	query: Record<string, string | null>;
	request: globalThis.Request;
	set: {
		cookie?: Record<string, Prettify<CookieOptions & {
			value: string;
		}>>;
		headers: Record<string, string> & {
			"Set-Cookie"?: string[] | string;
		};
		redirect?: string;
		status?: HTTPStatusName | number;
	};
	store: {};
}


type MiddlewareArray<Arr extends Record<string, unknown>[]> = Arr extends [infer First, ...infer Rest]
	? First extends Record<string, unknown>
	? Rest extends Record<string, unknown>[]
	? CreateMiddleware<First> & MiddlewareArray<Rest>
	: never
	: never
	: {};

type CreateRoute<Route extends string, Body extends Record<string, boolean | number | string | null | undefined> | unknown = unknown, MiddlewareSettings extends Record<string, unknown>[] = []> = CreateRouteOptions<Route, Body> & MiddlewareArray<MiddlewareSettings>;

class Route {
	public readonly App: App;

	public Middleware: ((req: CreateRouteOptions<string, {}>) => CreateMiddleware | Promise<CreateMiddleware>)[];

	public AllowedContentTypes: ContentTypes[];

	public Route: string;

	public KillSwitched: boolean; // KillSwitched routes will be populated in the routes, though when someone tries to use it, we'll return a 503 error (default is false)

	public constructor(App: App) {
		this.App = App;

		this.AllowedContentTypes = [];

		this.Route = "";

		this.KillSwitched = false;

		this.Middleware = [];
	}


	public Request(req: any) {
		return req;
	}
}

export default Route;

export type { Route, Method, ContentTypes, CreateRouteOptions, CreateRoute, CreateMiddleware };
