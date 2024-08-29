import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signIn } from '$lib/auth';
import type { SignInParams, SiwsCookie } from '$lib/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const params: SignInParams = {
			redirect_uri: body.redirect_uri,
			state: body.state,
			nonce: body.nonce,
			client_id: body.client_id
		};
		const sessionId = cookies.get('session');

		const siwsCookie: SiwsCookie = JSON.parse(cookies.get('siws') || '{}');

		if (!sessionId) {
			return json({ error: 'No session found' }, { status: 400 });
		}

		const redirectUrl = await signIn(params, sessionId, siwsCookie);

		return json({ redirect_url: redirectUrl });
	} catch (err) {
		console.error(err);
		return error(500, { message: 'Internal Server Error' });
	}
};
