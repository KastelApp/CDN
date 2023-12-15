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

import type { ClientOptions } from "@kastelll/cassandra-driver";
import type * as Sentry from "@sentry/node";

export interface Server {
	CloudflareAccessOnly: boolean;
	Domain: string;
	LocalIps?: string[];
	Port?: number | string;
	Secure: boolean;
	// if true then some routes will require captcha (register, login, etc)
	Sentry: {
		Dsn: string;
		Enabled: boolean;
		OtherOptions: Exclude<Sentry.NodeOptions, "dsn" | "tracesSampleRate">;
		RequestOptions: Sentry.Handlers.RequestHandlerOptions;
		TracesSampleRate: number;
	};
	StrictRouting: boolean;
}

export interface Encryption {
	Algorithm: string;
	InitVector: string;
	SecurityKey: string;
	TokenKey: string;
}

export interface ScyllaDB {
	CassandraOptions: Omit<ClientOptions, "credentials" | "keyspace">;
	DurableWrites: boolean;
	Keyspace: string;
	NetworkTopologyStrategy: {
		[DataCenter: string]: number;
	};
	Nodes: string[];
	Password: string;
	Username: string;
}

export interface Config {
	Encryption: Encryption;
	ScyllaDB: ScyllaDB;
	Server: Server;
}
