import { PUBLIC_SIWS_COOKIE_KEY } from '$env/static/public';
import { dbClient } from '$lib/db';
import { toSignMessage, verifySignedSignature } from '$lib/solana';
import { CodeEntry, SignInParamsSchema, SiwsCookieSchema } from '$lib/types';
import { error, json, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { parse, parseAsync, type ValiError } from 'valibot';

export async function GET({ url, cookies }) {
	const redirect_uri = url.searchParams.get('redirect_uri');
	const state = url.searchParams.get('state');
	const nonce = url.searchParams.get('nonce');
	const client_id = url.searchParams.get('client_id');
	const response_type = url.searchParams.get('response_type');
	const scope = url.searchParams.get('scope');
	const signInParams = await parseAsync(SignInParamsSchema, {
		redirect_uri,
		state,
		nonce,
		client_id,
		response_type,
		scope
	}).catch((e) => error(400, (e as ValiError<typeof SignInParamsSchema>).message));
	const siwsCookie = cookies.get(PUBLIC_SIWS_COOKIE_KEY);
	if (!siwsCookie) {
		return error(400, 'No `siws` cookie');
	}

	const siweCookieData = await parseAsync(SiwsCookieSchema, siwsCookie).catch((e) =>
		error(400, (e as ValiError<typeof SiwsCookieSchema>).message)
	);

	const sessionId = randomUUID();

	const secret = generateRandomString(10, alphabet('a-z', '0-9'));

	await dbClient.setSession(sessionId, {
		oidc_nonce: signInParams.oidc_nonce,
		siws_nonce: signInParams.nonce,
		secret,
		signin_count: 0
	});

	try {
		const message = toSignMessage(siweCookieData.message);
		console.log(message);

		// Verify the Solana signature
		const verified = await verifySignedSignature(
			message,
			Uint8Array.from(new TextEncoder().encode(siweCookieData.signature))
		);
		if (!verified) {
			return error(400, 'Failed message verification');
		}

		const domain = new URL(signInParams.redirect_uri);

		if (siweCookieData.message.resources && siweCookieData.message.resources.length > 0) {
			if (domain.toString() !== new URL(siweCookieData.message.resources[0]).toString()) {
				return json({ error: 'Conflicting domains in message and redirect' }, { status: 400 });
			}
		} else {
			return json({ error: 'Missing resource in SIWE message' }, { status: 400 });
		}

		const codeEntry = parse(CodeEntry, {
			address: siweCookieData.message.address,
			nonce: signInParams.oidc_nonce,
			exchange_count: 0,
			client_id: signInParams.client_id,
			auth_time: new Date().toISOString(),
			chain_id: null
		});

		const sessionEntry = await dbClient.getSession(sessionId);
		if (!sessionEntry) {
			return error(400, 'Session not found');
		}
		if (sessionEntry.secret !== secret) {
			return error(400, 'Invalid session secret');
		}
		sessionEntry.signin_count += 1;
		await dbClient.setSession(sessionId, sessionEntry);

		const code = randomUUID();
		await dbClient.setCode(code, codeEntry);

		const redirectUrl = new URL(signInParams.redirect_uri);

		redirectUrl.searchParams.append('code', code);
		redirectUrl.searchParams.append('state', signInParams.state);

		return redirect(302, redirectUrl.toString());
	} catch (err) {
		console.error(err);
		return error(500, 'Internal Server Error');
	}
}
