import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbClient } from '$lib/db';
import { resolveUsername, resolveAvatar } from '$lib/solana';
import { validateJWT } from 'oslo/jwt';

export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return json({ error: 'invalid_token' }, { status: 401 });
	}

	const token = authHeader.slice(7);

	try {
		const jwtKey = new TextEncoder().encode(process.env.JWT_SECRET);
		await validateJWT('RS256', jwtKey, token);
	} catch {
		return error(401, { message: 'invalid_token' });
	}

	const codeEntry = await dbClient.getCode(token);

	if (!codeEntry) {
		return error(401, { message: 'invalid_token' });
	}

	const username = await resolveUsername(codeEntry.address);
	const avatar = await resolveAvatar(codeEntry.address);

	return json({
		sub: `eip155:1:${codeEntry.address}`,
		preferred_username: username,
		picture: avatar
	});
};
