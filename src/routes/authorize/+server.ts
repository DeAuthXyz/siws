import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authorize } from '$lib/auth';
import type { AuthorizeParams } from '$lib/types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const params: AuthorizeParams = {
			client_id: url.searchParams.get('client_id') || '',
			redirect_uri: url.searchParams.get('redirect_uri') || '',
			scope: url.searchParams.get('scope') || '',
			response_type: url.searchParams.get('response_type') || undefined,
			state: url.searchParams.get('state') || undefined,
			nonce: url.searchParams.get('nonce') || undefined
		};

		const [redirectUrl, sessionId] = await authorize(params);

		cookies.set('session', sessionId, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 3600,
			path: '/'
		});

		return json(
			{ redirect_url: redirectUrl },
			{
				headers: {
					'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
				}
			}
		);
	} catch (error) {
		console.error(error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
