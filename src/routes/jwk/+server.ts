import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPublicKey } from 'crypto';

export const GET: RequestHandler = async () => {
	const publicKey = createPublicKey(process.env.RSA_PUBLIC_KEY as string);
	const jwk = publicKey.export({ format: 'jwk' });

	const jwks = {
		keys: [
			{
				kty: jwk.kty,
				e: jwk.e,
				use: 'sig',
				kid: '1',
				alg: 'RS256',
				n: jwk.n
			}
		]
	};

	return json(jwks);
};
