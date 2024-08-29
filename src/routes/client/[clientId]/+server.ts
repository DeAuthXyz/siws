import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbClient } from '$lib/db';

export const GET: RequestHandler = async ({ params }) => {
	const clientId = params.clientId;
	const client = await dbClient.getClient(clientId);

	if (!client) {
		return json({ error: 'client_not_found' }, { status: 404 });
	}

	return json({
		client_id: clientId,
		redirect_uris: client.redirect_uris
	});
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const clientId = params.clientId;
	const body = await request.json();

	if (!body.redirect_uris || !Array.isArray(body.redirect_uris)) {
		return json({ error: 'invalid_redirect_uri' }, { status: 400 });
	}

	const client = await dbClient.getClient(clientId);
	if (!client) {
		return json({ error: 'client_not_found' }, { status: 404 });
	}

	await dbClient.setClient(clientId, {
		...client,
		redirect_uris: body.redirect_uris
	});

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const clientId = params.clientId;
	await dbClient.deleteClient(clientId);
	return json({ success: true });
};
