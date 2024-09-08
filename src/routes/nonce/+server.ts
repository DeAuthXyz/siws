import { generateNonce } from '$lib/solana.js';

export const GET = async () => {
	const nonce = await generateNonce();
	return new Response(nonce, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
		}
	});
};
