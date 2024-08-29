import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const jwks = {
	keys: [
		{
			kty: 'RSA',
			e: 'AQAB',
			use: 'sig',
			kid: '1',
			alg: 'RS256',
			n: process.env.JWK_PUBLIC_KEY
		}
	]
};

export const GET: RequestHandler = async () => {
	return json(jwks);
};
