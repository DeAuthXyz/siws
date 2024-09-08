import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
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
		token_endpoint_auth_methods_supported: [
			'client_secret_basic',
			'client_secret_post',
			'private_key_jwt'
		],
		claims_supported: [
			'sub',
			'iss',
			'aud',
			'exp',
			'iat',
			'auth_time',
			'nonce',
			'preferred_username',
			'picture'
		],
		grant_types_supported: ['authorization_code', 'implicit'],
		token_endpoint_auth_signing_alg_values_supported: ['RS256'],
		userinfo_signing_alg_values_supported: ['RS256'],
		request_object_signing_alg_values_supported: ['RS256'],
		response_modes_supported: ['query', 'fragment'],
		display_values_supported: ['page', 'popup'],
		claim_types_supported: ['normal'],
		service_documentation: `${baseUrl}/docs`,
		claims_parameter_supported: false,
		request_parameter_supported: true,
		request_uri_parameter_supported: true,
		require_request_uri_registration: false,
		op_policy_uri: `${baseUrl}/legal/privacy-policy.pdf`,
		op_tos_uri: `${baseUrl}/legal/terms-of-use.pdf`
	};

	return json(config);
};
