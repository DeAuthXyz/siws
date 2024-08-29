import type { Address, SignatureBytes } from '@solana/web3.js';

export interface AuthorizeParams {
	client_id: string;
	redirect_uri: string;
	scope: string;
	response_type?: string;
	state?: string;
	nonce?: string;
}

export interface SignInParams {
	redirect_uri: string;
	state: string;
	nonce?: string;
	client_id: string;
}

export interface CodeEntry {
	address: Address;
	nonce?: string;
	exchange_count: number;
	client_id: string;
	auth_time: Date;
}

export interface SessionEntry {
	siws_nonce: string;
	oidc_nonce?: string;
	secret: string;
	signin_count: number;
}

export interface ClientEntry {
	secret: string;
	redirect_uris: string[];
	access_token?: string;
}

export interface SiwsCookie {
	message: SolanaMessage;
	signature: SignatureBytes;
}

export interface SolanaMessage {
	domain: string;
	address: Address;
	statement: string;
	uri: string;
	version: string;
	chainId: number;
	nonce: string;
	issuedAt: string;
}

export interface UserInfoClaims {
	sub: string;
	preferred_username?: string;
	picture?: string;
}
