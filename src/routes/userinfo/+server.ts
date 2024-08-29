import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbClient } from '$lib/db';
import { resolveUsername, resolveAvatar } from '$lib/solana';

export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return json({ error: 'invalid_token' }, { status: 401 });
	}

	const token = authHeader.slice(7);
	const codeEntry = await dbClient.getCode(token);

	if (!codeEntry) {
		return json({ error: 'invalid_token' }, { status: 401 });
	}

	const username = await resolveUsername(codeEntry.address);
	const avatar = await resolveAvatar(codeEntry.address);

	return json({
		sub: `eip155:1:${codeEntry.address}`,
		preferred_username: username,
		picture: avatar
	});
};
