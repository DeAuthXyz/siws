import type { Address } from '@solana/web3.js';
import {
	array,
	object,
	optional,
	string,
	type InferOutput,
	pipe,
	url,
	number,
	date,
	null_,
	isoDateTime,
	isoDate
} from 'valibot';

export interface AuthorizeParams {
	client_id: string;
	redirect_uri: string;
	scope: string;
	response_type?: string;
	state?: string;
	nonce?: string;
}

export const SignInParamsSchema = object({
	redirect_uri: pipe(string(), url()),
	state: string(),
	nonce: string(),
	oidc_nonce: optional(string()),
	client_id: string(),
	response_type: string(),
	scope: string()
});

export interface SessionEntry {
	siws_nonce: string;
	oidc_nonce?: string;
	secret: string;
	signin_count: number;
}

export type SignInParams = InferOutput<typeof SignInParamsSchema>;

export const CodeEntry = object({
	address: string(),
	nonce: optional(string()),
	exchange_count: number(),
	client_id: string(),
	auth_time: pipe(string(), isoDate()),
	chain_id: null_()
});

export type CodeEntry = InferOutput<typeof CodeEntry>;

export interface ClientEntry {
	secret: string;
	redirect_uris: string[];
	access_token?: string;
}

export const SolanaMessageSchema = object({
	domain: string(),
	address: string(),
	statement: string(),
	uri: string(),
	version: string(),
	chainId: string(),
	nonce: string(),
	issued_at: string(),
	expirationTime: optional(string()),
	notBefore: optional(string()),
	requestId: optional(string()),
	resources: array(string())
});

export type SolanaMessage = InferOutput<typeof SolanaMessageSchema>;

export interface UserInfoClaims {
	sub: string;
	preferred_username?: string;
	picture?: string;
}

export const SiwsCookieSchema = object({
	message: SolanaMessageSchema,
	signature: string()
});

export type SiwsCookie = InferOutput<typeof SiwsCookieSchema>;
