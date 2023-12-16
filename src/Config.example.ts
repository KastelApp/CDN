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
	S3Config,
} from "./Types/ConfigTypes";

const Server: ServerConfigType = {
	Port: 62_250,
	Domain: "kastelapp.com",
	Forwarder: {
		Domain: "media.kastelapp.com",
		Secret: ""
	},
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

const S3: S3Config = {
	Region: "us-east-1",
	// We use 4 users, 2 for guild stuff (files and such) and 2 for User stuff (avatars and such (guild avatars are included in this))
	// We do one user for fetching and deleting, and one for uploading
	// This is due to other projects / stuff that only need specific permissions
	Users: [
		{
			Type: "Guild",
			Bucket: "my-awesome-bucket",
			AcessKey: "",
			Permissions: ["Delete", "Fetch"],
			SecretKey: ""
		},
		{
			Type: "Guild",
			Bucket: "my-awesome-bucket",
			AcessKey: "",
			Permissions: ["Upload"],
			SecretKey: ""
		},
		{
			Type: "User",
			Bucket: "my-awesome-bucket",
			AcessKey: "",
			Permissions: ["Delete", "Fetch"],
			SecretKey: ""
		},
		{
			Type: "User",
			Bucket: "my-awesome-bucket",
			AcessKey: "",
			Permissions: ["Upload"],
			SecretKey: ""
		}
	]
};


const Config: ConfigType = {
	Server,
	Encryption,
	ScyllaDB,
	S3
};

export { Config, Server, Encryption, ScyllaDB, S3 };

export default {
	Config,
	Server,
	Encryption,
	ScyllaDB,
	S3
};
