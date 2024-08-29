import { json } from '@sveltejs/kit';

export const GET = async ({ url }) => {
	const baseUrl = `${url.protocol}//${url.host}`;
	const config = {
		issuer: process.env.ISSUER_URL || baseUrl,
		authorization_endpoint: `${baseUrl}/authorize`,
		token_endpoint: `${baseUrl}/token`,
		userinfo_endpoint: `${baseUrl}/userinfo`,
		jwks_uri: `${baseUrl}/jwk`,
		registration_endpoint: `${baseUrl}/register`,
		scopes_supported: ['openid', 'profile'],
		response_types_supported: ['code', 'id_token', 'token id_token'],
		subject_types_supported: ['public'],
		id_token_signing_alg_values_supported: ['RS256'],
		token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
		claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'preferred_username', 'picture'],
		op_policy_uri: `${baseUrl}/legal/privacy-policy.pdf`,
		op_tos_uri: `${baseUrl}/legal/terms-of-use.pdf`
	};

	return json(config);
};
