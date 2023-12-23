/* eslint-disable id-length */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { URL } from "node:url";
import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { Snowflake } from "@kastelll/util";
import * as Sentry from "@sentry/node";
import { Elysia } from "elysia";
import { type SimpleGit, simpleGit } from "simple-git";
import { Config } from "../../Config.ts";
import Constants, { Relative } from "../../Constants.ts";
import type { ExpressMethodCap } from "../../Types/index.ts";
import ProcessArgs from "../ProcessArgs.ts";
import Connection from "./Connection.ts";
import ErrorGen from "./ErrorGen.ts";
import CustomLogger from "./Logger.ts";
import Repl from "./Repl.ts";
import type { ContentTypes } from "./Route.ts";
import RouteBuilder from "./Route.ts";
import SystemInfo from "./SystemInfo.ts";

type GitType = "Added" | "Copied" | "Deleted" | "Ignored" | "Modified" | "None" | "Renamed" | "Unmerged" | "Untracked";

const SupportedArgs = ["debug", "skip-online-check", "behind-proxy", "no-ip-checking"] as const;

class App {
	private RouteDirectory: string = join(new URL(".", import.meta.url).pathname, "../../Routes");

	public ElysiaApp: Elysia;

	public Ready: boolean = false;

	public Snowflake: Snowflake;

	public Cassandra: Connection;

	public Sentry: typeof Sentry;

	public Config: typeof Config = Config;

	public Constants: typeof Constants = Constants;

	public Logger: CustomLogger;

	public static StaticLogger: CustomLogger = new CustomLogger();

	public Routes: {
		default: RouteBuilder;
		directory: string;
		method: ExpressMethodCap;
		route: string;
	}[] = [];

	private Clean: boolean = false;

	public InternetAccess: boolean = false;

	public Git: SimpleGit = simpleGit();

	private GitFiles: {
		filePath: string;
		type: GitType;
	}[] = [];

	public GitBranch: string = "Unknown";

	public GitCommit: string = "Unknown";

	private TypeIndex = {
		A: "Added",
		D: "Deleted",
		M: "Modified",
		R: "Renamed",
		C: "Copied",
		U: "Unmerged",
		"?": "Untracked",
		"!": "Ignored",
		" ": "None",
	};

	public Repl: Repl;

	// first string is an encrypted file id which the client uses to fetch the presigned url (cloudflare)
	// the other string is the temporary url
	public PreSignedUrls: Map<string, {
		Expires: number;
		Key: string;
		Sha256: string;
		Url: string;
		UserId?: string;
	}> = new Map();

	public PreSignedFetchedUrls: Map<string, {
		Expire: number; // Default should be around 6 hours
		Name: string;
		Type?: string;
		Url: string;
	}> = new Map();

	public Args: typeof SupportedArgs = ProcessArgs(SupportedArgs as unknown as string[])
		.Valid as unknown as typeof SupportedArgs;

	public constructor() {
		this.ElysiaApp = new Elysia();

		this.Snowflake = new Snowflake(Constants.Snowflake);

		this.Cassandra = new Connection(
			Config.ScyllaDB.Nodes,
			Config.ScyllaDB.Username,
			Config.ScyllaDB.Password,
			Config.ScyllaDB.Keyspace,
			Config.ScyllaDB.NetworkTopologyStrategy,
			Config.ScyllaDB.DurableWrites,
			Config.ScyllaDB.CassandraOptions,
		);

		this.Sentry = Sentry;

		this.Logger = new CustomLogger();

		this.Repl = new Repl(CustomLogger.colorize("#E6AF2E", "> "), [
			{
				name: "disable",
				description: "Disable something (Route, User, etc)",
				args: [],
				flags: [
					{
						name: "route",
						description: "The route to disable",
						shortName: "r",
						value: "string",
						maxLength: 1e3,
						minLength: 1,
						optional: true,
					},
					{
						name: "user",
						description: "The user to disable",
						shortName: "u",
						value: "string",
						maxLength: 1e3,
						minLength: 1,
						optional: true,
					},
				],
				cb: () => { },
			},
			{
				name: "version",
				description: "Get the version of the backend",
				args: [],
				flags: [],
				cb: () => {
					console.log(
						`You're running version ${Relative.Version ? `v${Relative.Version}` : "Unknown version"
						} of Kastel's Backend. Bun version ${Bun.version}`,
					);
				},
			},
			{
				name: "close",
				description: "Close the REPL (Note: you will need to restart the backend to open it again)",
				args: [],
				flags: [],
				cb: () => {
					this.Repl.endRepl();
				},
			},
			{
				name: "clear",
				description: "Clear the console",
				args: [],
				flags: [],
				cb: () => {
					console.clear();
				},
			},
		]);

		setInterval(() => {
			for (const [Key, Value] of this.PreSignedUrls) {
				if (Value.Expires < Date.now()) {
					this.PreSignedUrls.delete(Key);
				}
			}

			for (const [Key, Value] of this.PreSignedFetchedUrls) {
				if (Value.Expire < Date.now()) {
					this.PreSignedFetchedUrls.delete(Key);
				}
			}
		}, 1e3); // every second (1000ms)
	}

	public async Init(): Promise<void> {
		this.Logger.hex("#ca8911")(
			`\n██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     \n██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     \n█████╔╝ ███████║███████╗   ██║   █████╗  ██║     \n██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     \n██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗\n╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝\nA Chatting Application\nRunning version ${Relative.Version ? `v${Relative.Version}` : "Unknown version"
			} of Kastel's CDN. Bun version ${Bun.version
			}\nIf you would like to support this project please consider donating to https://opencollective.com/kastel\n`,
		);

		await this.SetupDebug(this.Args.includes("debug"));

		this.Repl.startRepl();

		this.Cassandra.on("Connected", () => this.Logger.info("Connected to ScyllaDB"));
		this.Cassandra.on("Error", (err) => {
			console.error(err);
			this.Logger.fatal(err);

			process.exit(1);
		});

		this.Logger.info("Connecting to ScyllaDB");
		this.Logger.warn("IT IS NOT FROZEN, ScyllaDB may take a while to connect");

		await this.Cassandra.Connect();

		this.Logger.info("Creating ScyllaDB Tables.. This may take a while..");
		this.Logger.warn("IT IS NOT FROZEN, ScyllaDB may take a while to create the tables");

		const TablesCreated = await this.Cassandra.CreateTables();

		if (TablesCreated) {
			this.Logger.info("Created ScyllaDB tables");
		} else {
			this.Logger.warn("whar");
		}

		process
			.on("uncaughtException", (err) => {
				if (Config.Server.Sentry.Enabled) {
					Sentry.captureException(err);
				}

				this.Logger.error("Uncaught Exception, \n", err?.stack ? err.stack : err);
			})
			.on("unhandledRejection", (reason: any) => {
				if (Config.Server.Sentry.Enabled) {
					Sentry.captureException(reason);
				}

				this.Logger.error(`Unhandled Rejection, \n${reason?.stack ? reason.stack : reason}`);
			});

		this.ElysiaApp.use(cors())
			.use(serverTiming())
			.onError(({ code, request, path }) => {
				if (code === "NOT_FOUND") {
					const Error = ErrorGen.NotFound();

					Error.AddError({
						NotFound: {
							Code: "NotFound",
							Message: `Could not find route for ${request.method} ${path}`,
						},
					});

					return Error.toJSON();
				}

				if (code === "INTERNAL_SERVER_ERROR") {
					return "Internal Server Error :(";
				}

				return "Unknown error";
			});


		// guilds with params should be at the bottom as ones without them take priority
		const LoadedRoutes = (await this.LoadRoutes()).sort((a, b) => {
			if (a.route.includes(":") && !b.route.includes(":")) {
				return 1;
			}

			if (!a.route.includes(":") && b.route.includes(":")) {
				return -1;
			}

			return 0;
		});


		for (const Route of LoadedRoutes) {
			this.Logger.verbose(
				`Loaded "${Route.route.length === 0 ? "/" : Route.route}" [${Route.method}]`,
			);
			
			this.ElysiaApp[Route.method.toLowerCase() as ExpressMethodCap](Route.route, async ({ body, headers, params, path, query, request, set, store }) => {
				const FinishedMiddlewares = [];
				
				this.Logger.info(`Request to ${Route.route} [${Route.method}]`);
				
				for (const Middleware of Route.default.Middleware) {
					const Finished = await Middleware({
						app: this,
						body: body as {},
						headers,
						params,
						path,
						query,
						request,
						set,
						store
					});
										
					if (set.status !== 200) {
						this.Logger.info(`Request to ${Route.route} [${Route.method}] finished with status ${set.status} from middleware ${Middleware.name}`);
				
						return Finished;
					}
					
					FinishedMiddlewares.push(Finished);
				}
				
				if (Route.default.AllowedContentTypes.length > 0 && !Route.default.AllowedContentTypes.includes((headers["content-type"] ?? "text/plain") as ContentTypes)) {
					const Error = ErrorGen.InvalidContentType();

					Error.AddError({
						ContentType: {
							Code: "InvalidContentType",
							Message: `Invalid Content-Type header, Expected (${Route.default.AllowedContentTypes.join(
								", ",
							)}), Got (${headers["content-type"]})`,
						},
					});

					set.status = 400;
					set.headers["Content-Type"] = "application/json";
					
					this.Logger.info(`Request to ${Route.route} [${Route.method}] finished with status ${set.status} from invalid content type`);
					
					return Error.toJSON();
				}
				
				const Requested = await Route.default.Request({
					app: this,
					body: body as {},
					headers,
					params,
					path,
					query,
					request,
					set,
					store,
					...FinishedMiddlewares.reduce((a, b) => ({ ...a, ...b }), {})
				}) as Promise<unknown>;
				
				this.Logger.info(`Request to ${Route.route} [${Route.method}] finished with status ${set.status}`);
				
				return Requested;
			})
		}
		
		this.Logger.info(`Loaded ${LoadedRoutes.length} routes`);

		this.ElysiaApp.listen(Config.Server.Port, () => {
			this.Logger.info(`Listening on port ${Config.Server.Port}`);
		});
	}

	private async LoadRoutes(): Promise<(typeof this)["Routes"]> {
		const Routes = await this.WalkDirectory(this.RouteDirectory);

		for (const Route of Routes) {
			if (!Route.endsWith(".ts")) {
				this.Logger.debug(`Skipping ${Route} as it is not a .ts file`);

				continue;
			}

			const RouteClass = await import(Route);

			if (!RouteClass.default) {
				this.Logger.warn(`Skipping ${Route} as it does not have a default export`);

				continue;
			}

			const RouteInstance = new RouteClass.default(this);

			if (!(RouteInstance instanceof RouteBuilder)) {
				this.Logger.warn(`Skipping ${Route} as it does not extend Route`);

				continue;
			}

			const fixedRoute = (
				(Route.split(this.RouteDirectory)[1]?.replaceAll(/\\/g, "/").split("/").slice(0, -1).join("/") ?? "") +
				(RouteInstance.Route as string)
			).replace(/\/$/, "");

			// get the method. each file is like .get.ts or .post.ts
			const Method = (Route.split(".").slice(-2, -1)[0]?.toUpperCase() ?? "GET") as ExpressMethodCap;
			
			this.Routes.push({
				default: RouteInstance,
				directory: Route,
				route: fixedRoute.replaceAll(/\[([^\]]+)]/g, ":$1").length === 0 ? "/" : fixedRoute.replaceAll(/\[([^\]]+)]/g, ":$1"),  // eslint-disable-line prefer-named-capture-group
				method: Method,
			});
		}

		return this.Routes;
	}

	private async WalkDirectory(dir: string): Promise<string[]> {
		const Routes = await readdir(dir, { withFileTypes: true });

		const Files: string[] = [];

		for (const Route of Routes) {
			if (Route.isDirectory()) {
				const SubFiles = await this.WalkDirectory(join(dir, Route.name));
				Files.push(...SubFiles);
			} else {
				Files.push(join(dir, Route.name));
			}
		}

		return Files;
	}

	private async SetupDebug(Log: boolean) {
		const SystemClass = new SystemInfo();
		const System = await SystemClass.Info();
		const GithubInfo = await this.GithubInfo();

		const Strings = [
			"=".repeat(40),
			"Kastel Debug Logs",
			"=".repeat(40),
			`Backend Version: ${this.Constants.Relative.Version}`,
			`Bun Version: ${Bun.version}`,
			"=".repeat(40),
			"System Info:",
			`OS: ${System.OperatingSystem.Platform}`,
			`Arch: ${System.OperatingSystem.Arch}`,
			`Os Release: ${System.OperatingSystem.Release}`,
			`Internet Status: ${System.InternetAccess ? "Online" : "Offline - Some features may not work"}`,
			"=".repeat(40),
			"Hardware Info:",
			`CPU: ${System.Cpu.Type}`,
			`CPU Cores: ${System.Cpu.Cores}`,
			`Total Memory: ${System.Ram.Total}`,
			`Free Memory: ${System.Ram.Available}`,
			`Used Memory: ${System.Ram.Usage}`,
			"=".repeat(40),
			"Process Info:",
			`PID: ${process.pid}`,
			`Uptime: ${System.Process.Uptime}`,
			"=".repeat(40),
			"Git Info:",
			`Branch: ${this.GitBranch}`,
			`Commit: ${GithubInfo.CommitShort ?? GithubInfo.Commit}`,
			`Status: ${this.Clean ? "Clean" : "Dirty - You will not be given support if something breaks with a dirty instance"
			}`,
			this.Clean ? "" : "=".repeat(40),
			`${this.Clean ? "" : "Changed Files:"}`,
		];

		for (const File of this.GitFiles) {
			Strings.push(`${File.type}: ${File.filePath}`);
		}

		Strings.push("=".repeat(40));

		if (Log) {
			for (const String of Strings) {
				this.Logger.importantDebug(String);
			}
		}
	}

	private async GithubInfo(): Promise<{
		Branch: string;
		Clean: boolean;
		Commit: string | undefined;
		CommitShort: string | undefined;
	}> {
		const Branch = await this.Git.branch();
		const Commit = await this.Git.log();
		const Status = await this.Git.status();

		if (!Commit.latest?.hash) {
			this.Logger.fatal("Could not get Commit Info, are you sure you pulled the repo correctly?");

			process.exit(1);
		}

		this.GitBranch = Branch.current;

		this.GitCommit = Commit.latest.hash;

		this.Clean = Status.files.length === 0;

		for (const File of Status.files) {
			this.GitFiles.push({
				filePath: File.path,
				type: this.TypeIndex[File.working_dir as keyof typeof this.TypeIndex] as GitType,
			});
		}

		return {
			Branch: Branch.current,
			Commit: Commit.latest.hash,
			CommitShort: Commit.latest.hash.slice(0, 7),
			Clean: Status.files.length === 0,
		};
	}
}

export default App;

export { App };
