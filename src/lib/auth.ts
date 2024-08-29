import type { AuthorizeParams, SignInParams, SiwsCookie } from './types';
import { dbClient } from './db';
import { verifySignedSignature } from './solana';


export async function authorize(params: AuthorizeParams): Promise<[string, string]> {
	const clientEntry = await dbClient.getClient(params.client_id);
	if (!clientEntry) {
		throw new Error('Unrecognized client id');
	}

	const nonce = Math.random().toString(36).substring(2, 15);
	const sessionId = crypto.randomUUID();
	const sessionSecret = Math.random().toString(36).substring(2, 15);

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

	const isValid = await verifySignedSignature(siwsCookie.message, siwsCookie.signature);
	if (!isValid) {
		throw new Error('Invalid signature');
	}

	if (siwsCookie.message.nonce !== sessionEntry.siws_nonce) {
		throw new Error('Invalid nonce');
	}

	const codeEntry = {
		address: siwsCookie.message.address,
		nonce: params.nonce,
		exchange_count: 0,
		client_id: params.client_id,
		auth_time: new Date()
	};

	const code = crypto.randomUUID();
	await dbClient.setCode(code, codeEntry);

	const newSessionEntry = { ...sessionEntry, signin_count: sessionEntry.signin_count + 1 };
	await dbClient.setSession(sessionId, newSessionEntry);

	const redirectUrl = new URL(params.redirect_uri);
	redirectUrl.searchParams.append('code', code);
	redirectUrl.searchParams.append('state', params.state);

	return redirectUrl.toString();
}

// Implement other functions like token, userinfo, register, etc.
