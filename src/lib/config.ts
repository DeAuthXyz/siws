import {
	SIWS_OIDC_ADDRESS,
	SIWS_OIDC_BASE_URL,
	SIWS_OIDC_DEFAULT_CLIENTS,
	SIWS_OIDC_PORT,
	SIWS_OIDC_REDIS_URL,
	SIWS_OIDC_REQUIRE_SECRET,
	SIWS_OIDC_RSA_PEM
} from '$env/static/private';
import {
	object,
	string,
	number,
	boolean,
	optional,
	record,
	type InferOutput,
	parse
} from 'valibot';

const ConfigSchema = object({
	address: string(),
	port: number(),
	baseUrl: string(),
	rsaPem: optional(string()),
	redisUrl: string(),
	defaultClients: record(string(), string()),
	requireSecret: boolean(),
	ethProvider: optional(string())
});

export type ConfigType = InferOutput<typeof ConfigSchema>;

export class Config implements ConfigType {
	address: string;
	port: number;
	baseUrl: string;
	rsaPem?: string;
	redisUrl: string;
	defaultClients: Record<string, string>;
	requireSecret: boolean;

	constructor(config: Partial<ConfigType> = {}) {
		this.address = config.address ?? '127.0.0.1';
		this.port = config.port ?? 8000;
		this.baseUrl = config.baseUrl ?? 'http://127.0.0.1:8000';
		this.rsaPem = config.rsaPem;
		this.redisUrl = config.redisUrl ?? 'redis://localhost';
		this.defaultClients = config.defaultClients ?? {};
		this.requireSecret = config.requireSecret ?? false;
	}

	static default(): Config {
		return new Config();
	}

	static parse(input: ConfigType): Config {
		const parsedConfig = parse(ConfigSchema, input);
		return new Config(parsedConfig);
	}
}

export const config = Config.parse({
	address: SIWS_OIDC_ADDRESS,
	port: Number.parseInt(SIWS_OIDC_PORT),
	baseUrl: SIWS_OIDC_BASE_URL,
	rsaPem: SIWS_OIDC_RSA_PEM,
	redisUrl: SIWS_OIDC_REDIS_URL,
	defaultClients: JSON.parse(SIWS_OIDC_DEFAULT_CLIENTS),
	requireSecret: SIWS_OIDC_REQUIRE_SECRET === 'true'
});
