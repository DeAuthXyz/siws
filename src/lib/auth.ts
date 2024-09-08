import { createPrivateKey, createPublicKey, KeyObject } from 'crypto';
import { createJWT, validateJWT } from 'oslo/jwt';
import { TimeSpan } from 'oslo';
import type { AuthorizeParams, SignInParams, SiwsCookie, CodeEntry, SessionEntry } from './types';
import { dbClient } from './db';
import type { SolanaSignInInput } from '@solana/wallet-standard-features';
import { verifySignedSignature } from './solana';
import { address } from '@solana/web3.js';

let privateKey: KeyObject;
let publicKey: KeyObject;

export function initializeKeys(privateKeyPem: string) {
	privateKey = createPrivateKey(privateKeyPem);
	publicKey = createPublicKey(privateKey);
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
	const base64 = pem
		.replace('-----BEGIN PRIVATE KEY-----', '')
		.replace('-----END PRIVATE KEY-----', '')
		.replace(/\s/g, '');
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

export async function authorize(params: AuthorizeParams): Promise<[string, string]> {
	const clientEntry = await dbClient.getClient(params.client_id);
	if (!clientEntry) {
		throw new Error('Unrecognized client id');
	}

	const nonce = crypto.randomUUID();
	const sessionId = crypto.randomUUID();
	const sessionSecret = crypto.randomUUID();

	await dbClient.setSession(sessionId, {
		siws_nonce: nonce,
		oidc_nonce: params.nonce,
		secret: sessionSecret,
		signin_count: 0
	});

	const redirectUrl = new URL('/', params.redirect_uri);
	redirectUrl.searchParams.append('nonce', nonce);
	redirectUrl.searchParams.append('domain', new URL(params.redirect_uri).hostname);
	redirectUrl.searchParams.append('redirect_uri', params.redirect_uri);
	redirectUrl.searchParams.append('state', params.state || '');
	redirectUrl.searchParams.append('client_id', params.client_id);
	if (params.nonce) {
		redirectUrl.searchParams.append('oidc_nonce', params.nonce);
	}

	return [redirectUrl.toString(), sessionId];
}

export async function signIn(
	params: SignInParams,
	sessionId: string,
	siwsCookie: SiwsCookie
): Promise<string> {
	const sessionEntry = await dbClient.getSession(sessionId);
	if (!sessionEntry) {
		throw new Error('Session not found');
	}
	if (sessionEntry.signin_count > 0) {
		throw new Error('Session has already logged in');
	}

	// Assume signedMessage is already a string
	const signedMessage = siwsCookie.message;

	const isValid = await verifySignedSignature(signedMessage, siwsCookie.signature);
	if (!isValid) {
		throw new Error('Invalid signature');
	}

	// Parse the message
	const message: SolanaSignInInput = JSON.parse(signedMessage);

	// Validate the message
	if (message.domain !== new URL(params.redirect_uri).hostname) {
		throw new Error('Invalid domain');
	}
	if (message.nonce !== sessionEntry.siws_nonce) {
		throw new Error('Invalid nonce');
	}
	if (message.expirationTime && new Date(message.expirationTime) < new Date()) {
		throw new Error('Message has expired');
	}
	if (!message.address) {
		throw new Error('Invalid message: missing address');
	}

	const codeEntry: CodeEntry = {
		address: address(message.address),
		nonce: params.nonce,
		exchange_count: 0,
		client_id: params.client_id,
		auth_time: new Date(message.issuedAt || Date.now())
	};

	const code = crypto.randomUUID();
	await dbClient.setCode(code, codeEntry);

	const newSessionEntry: SessionEntry = {
		...sessionEntry,
		signin_count: sessionEntry.signin_count + 1
	};
	await dbClient.setSession(sessionId, newSessionEntry);

	const redirectUrl = new URL(params.redirect_uri);
	redirectUrl.searchParams.append('code', code);
	redirectUrl.searchParams.append('state', params.state);

	return redirectUrl.toString();
}

export async function createIdToken(codeEntry: CodeEntry, clientId: string): Promise<string> {
	const payload = {
		sub: codeEntry.address,
		aud: clientId,
		nonce: codeEntry.nonce,
		auth_time: Math.floor(codeEntry.auth_time.getTime() / 1000)
	};

	const keyArrayBuffer = pemToArrayBuffer(
		privateKey.export({ format: 'pem', type: 'pkcs8' }) as string
	);

	return createJWT('RS256', keyArrayBuffer, payload, {
		issuer: process.env.ISSUER_URL,
		expiresIn: new TimeSpan(1, 'h'),
		includeIssuedTimestamp: true
	});
}

export async function createAccessToken(address: string): Promise<string> {
	const payload = {
		sub: address,
		aud: [`${process.env.ISSUER_URL}/userinfo`],
		scope: 'openid profile'
	};

	const keyArrayBuffer = pemToArrayBuffer(
		privateKey.export({ format: 'pem', type: 'pkcs8' }) as string
	);

	return createJWT('RS256', keyArrayBuffer, payload, {
		issuer: process.env.ISSUER_URL,
		expiresIn: new TimeSpan(1, 'h'),
		includeIssuedTimestamp: true
	});
}

export async function verifyToken(token: string) {
	const keyArrayBuffer = pemToArrayBuffer(
		publicKey.export({ format: 'pem', type: 'spki' }) as string
	);
	return validateJWT('RS256', keyArrayBuffer, token);
}
