import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbClient } from '$lib/db';
import { createJWT } from 'oslo/jwt';
import { TimeSpan } from 'oslo';

export const POST: RequestHandler = async ({ request }) => {
	let code: string | null = null;
	let clientId: string | null = null;
	let clientSecret: string | null = null;
	let grantType: string | null = null;

	const contentType = request.headers.get('content-type');

	if (contentType?.includes('application/x-www-form-urlencoded')) {
		const formData = await request.formData();
		code = formData.get('code')?.toString() ?? null;
		clientId = formData.get('client_id')?.toString() ?? null;
		clientSecret = formData.get('client_secret')?.toString() ?? null;
		grantType = formData.get('grant_type')?.toString() ?? null;
	} else if (contentType?.includes('application/json')) {
		const body = await request.json();
		code = body.code ?? null;
		clientId = body.client_id ?? null;
		clientSecret = body.client_secret ?? null;
		grantType = body.grant_type ?? null;
	} else {
		return json({ error: 'unsupported_content_type' }, { status: 400 });
	}

	if (!code || !clientId || !clientSecret || grantType !== 'authorization_code') {
		return json({ error: 'invalid_request' }, { status: 400 });
	}

	const codeEntry = await dbClient.getCode(code);
	if (!codeEntry) {
		return json({ error: 'invalid_grant' }, { status: 400 });
	}

	const client = await dbClient.getClient(clientId);
	if (!client || client.secret !== clientSecret) {
		return json({ error: 'invalid_client' }, { status: 401 });
	}

	if (codeEntry.exchange_count > 0) {
		return json(
			{ error: 'invalid_grant', error_description: 'Authorization code already used' },
			{ status: 400 }
		);
	}

	await dbClient.setCode(code, { ...codeEntry, exchange_count: codeEntry.exchange_count + 1 });

	const jwtKey = new TextEncoder().encode(process.env.JWT_SECRET);

	try {
		const idToken = await createJWT(
			'RS256',
			jwtKey,
			{
				sub: codeEntry.address,
				aud: clientId,
				nonce: codeEntry.nonce,
				auth_time: Math.floor(codeEntry.auth_time.getTime() / 1000)
			},
			{
				issuer: process.env.ISSUER_URL,
				expiresIn: new TimeSpan(1, 'h'),
				includeIssuedTimestamp: true
			}
		);

		const accessToken = await createJWT(
			'RS256',
			jwtKey,
			{
				sub: codeEntry.address,
				aud: [`${process.env.ISSUER_URL}/userinfo`],
				scope: 'openid profile'
			},
			{
				issuer: process.env.ISSUER_URL,
				expiresIn: new TimeSpan(1, 'h'),
				includeIssuedTimestamp: true
			}
		);

		return json({
			access_token: accessToken,
			token_type: 'Bearer',
			id_token: idToken,
			expires_in: 3600
		});
	} catch (error) {
		console.error('Error creating JWT:', error);
		return json({ error: 'server_error' }, { status: 500 });
	}
};
