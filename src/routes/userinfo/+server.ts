import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveUsername, resolveAvatar } from '$lib/solana';
import { verifyToken } from '$lib/auth';

export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return json({ error: 'invalid_token' }, { status: 401 });
	}

	const token = authHeader.slice(7);

	try {
		const payload = await verifyToken(token);
		const address = payload.subject;

		if (!address) {
			throw new Error('Invalid token: missing subject');
		}

		const username = await resolveUsername(address);
		const avatar = await resolveAvatar(address);

		return json({
			sub: `solana:${address}`,
			preferred_username: username,
			picture: avatar,
			iss: process.env.ISSUER_URL,
			aud: payload.audiences,
			exp: payload.expiresAt,
			iat: payload.issuedAt
		});
	} catch (error) {
		console.error('Error verifying token:', error);
		return json({ error: 'invalid_token' }, { status: 401 });
	}
};
