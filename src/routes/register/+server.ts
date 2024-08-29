import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbClient } from '$lib/db';
import crypto from 'node:crypto';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	if (!body.redirect_uris || !Array.isArray(body.redirect_uris)) {
		return json({ error: 'invalid_redirect_uri' }, { status: 400 });
	}

	const clientId = crypto.randomUUID();
	const clientSecret = crypto.randomBytes(32).toString('hex');

	await dbClient.setClient(clientId, {
		secret: clientSecret,
		redirect_uris: body.redirect_uris
	});

	return json({
		client_id: clientId,
		client_secret: clientSecret,
		redirect_uris: body.redirect_uris
	});
};
