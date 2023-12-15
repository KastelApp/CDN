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

import type {
	Encryption as EncrpytionConfigType,
	ScyllaDB as ScyllaDBConfigType,
	Server as ServerConfigType,
	Config as ConfigType,
} from "./Types/ConfigTypes";

const Server: ServerConfigType = {
	Port: 62_250,
	Domain: "kastelapp.com",
	Secure: true, // https or http
	CloudflareAccessOnly: false, // If you are behind cloudflare and have a cloudflare worker forwarding the requests to the server then set this to true
	StrictRouting: true,
	Sentry: {
		Enabled: false,
		Dsn: "",
		TracesSampleRate: 1,
		OtherOptions: {
			environment: "development",
		},
		RequestOptions: {
			user: ["email", "id"],
			ip: true,
		},
	},
	LocalIps: ["0.0.0.0", "localhost"], // These are for local tests, and to allow the WebSocket to make HTTP requests to the server
};

const Encryption: EncrpytionConfigType = {
	Algorithm: "aes-256-cbc",
	InitVector: "",
	SecurityKey: "",
	TokenKey: "",
};

const ScyllaDB: ScyllaDBConfigType = {
	Nodes: ["172.17.0.1"],
	Keyspace: "kastel",
	Username: "kstl",
	Password: "",
	CassandraOptions: {},
	DurableWrites: true,
	NetworkTopologyStrategy: {},
};


const Config: ConfigType = {
	Server,
	Encryption,
	ScyllaDB,
};

export { Config, Server, Encryption, ScyllaDB };

export default {
	Config,
	Server,
	Encryption,
	ScyllaDB,
};
