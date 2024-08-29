import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const data = {
		domain: url.searchParams.get('domain'),
		nonce: url.searchParams.get('nonce'),
		redirect: url.searchParams.get('redirect_uri') ?? 'https://www.example.com',
		state: url.searchParams.get('state'),
		oidc_nonce: url.searchParams.get('oidc_nonce'),
		client_id: url.searchParams.get('client_id')
	} as const;
	return data;
};
