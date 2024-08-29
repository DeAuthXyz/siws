import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbClient } from '$lib/db';
import { createJWT } from 'oslo/jwt';
import { TimeSpan } from 'oslo';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.formData();
	const code = body.get('code');
	const clientId = body.get('client_id');
	const clientSecret = body.get('client_secret');

	if (!code || !clientId || !clientSecret) {
		return json({ error: 'invalid_request' }, { status: 400 });
	}

	const codeEntry = await dbClient.getCode(code.toString());
	if (!codeEntry) {
		return json({ error: 'invalid_grant' }, { status: 400 });
	}

	const client = await dbClient.getClient(clientId.toString());
	if (!client || client.secret !== clientSecret) {
		return json({ error: 'invalid_client' }, { status: 401 });
	}

	const jwtKey = new TextEncoder().encode(process.env.JWT_SECRET);

	const idToken = await createJWT(
		'RS256',
		jwtKey,
		{
			sub: codeEntry.address,
			aud: clientId
		},
		{
			issuer: process.env.ISSUER_URL,
			expiresIn: new TimeSpan(1, 'h'),
			includeIssuedTimestamp: true
		}
	);

	return json({
		access_token: code,
		token_type: 'Bearer',
		id_token: idToken,
		expires_in: 3600
	});
};
