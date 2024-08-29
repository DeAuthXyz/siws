import { describe, it, expect, beforeAll } from 'vitest';
import {
	createSignableMessage,
	generateKeyPair,
	getAddressFromPublicKey,
	signBytes
} from '@solana/web3.js';
import base58 from 'bs58';
import { dbClient } from '$lib/db';
import { GET as authorize } from './routes/authorize/+server';
import { POST as signIn } from './routes/sign_in/+server';
import { GET as userInfo } from './routes/userinfo/+server';
import type { AuthorizeParams, SignInParams, SiwsCookie } from '$lib/types';
import { parseCookies } from 'oslo/cookie';

describe('End-to-End Flow', () => {
	let wallet: CryptoKeyPair;
	const baseUrl = 'https://example.com';
	const clientId = 'test-client-id';
	const clientSecret = 'test-client-secret';

	beforeAll(async () => {
		// Initialize a Solana wallet
		const privateKey = await generateKeyPair();
		wallet = privateKey;
		await dbClient.setClient(clientId, {
			redirect_uris: [`${baseUrl}/callback`],
			secret: clientSecret,
			access_token: 'test-access-token'
		});
	});

	it('should complete the full authentication flow', async () => {
		// Step 1: Authorize
		const authorizeParams: AuthorizeParams = {
			client_id: clientId,
			redirect_uri: `${baseUrl}/callback`,
			scope: 'openid',
			response_type: 'id_token',
			state: 'state'
		};

		const authorizeResponse = await authorize({
			url: new URL(`${baseUrl}/authorize?${new URLSearchParams(authorizeParams as any)}`),
			// Mock the cookies.set function
			cookies: {
				set: (name: string, value: string) => {}
			}
		} as any);
		const authorizeData = await authorizeResponse.json();

		expect(authorizeData.redirect_url).toBeDefined();
		const sessionCookie = parseCookies(authorizeResponse.headers.get('set-cookie')).get('session');

		expect(sessionCookie).toBeDefined();

		// Step 2: Parse authorize response
		const authorizeRedirectUrl = new URL(authorizeData.redirect_url);
		const nonce = authorizeRedirectUrl.searchParams.get('nonce');
		expect(nonce).toBeDefined();

		// Step 3: Prepare sign-in message
		const message = {
			domain: 'example.com',
			address: await getAddressFromPublicKey(wallet.publicKey),
			statement: 'statement',
			uri: baseUrl,
			version: '1',
			chainId: 1,
			nonce: nonce!,
			issuedAt: new Date().toISOString()
		};

		// Step 4: Sign message (simulated for Solana)
		const messageBytes = createSignableMessage(JSON.stringify(message));
		const signature = await signBytes(wallet.privateKey, messageBytes.content);

		// Step 5: Prepare sign-in request
		const signInParams: SignInParams = {
			redirect_uri: `${baseUrl}/callback`,
			state: 'state',
			client_id: clientId
		};

		const siwsCookie: SiwsCookie = {
			message,
			signature,
			
		};

		// console.log(sessionCookie);
		// Step 6: Sign In
		const signInResponse = await signIn({
			request: {
				json: async () => signInParams
			},
			cookies: {
				get: (name: string) => (name === 'session' ? sessionCookie : JSON.stringify(siwsCookie))
			}
		} as any);

		const signInData = await signInResponse.json();
		// console.log(signInData);
		expect(signInData.redirect_url).toBeDefined();

		// Step 7: Parse sign-in response
		const signInRedirectUrl = new URL(signInData.redirect_url);
		const code = signInRedirectUrl.searchParams.get('code');
		expect(code).toBeDefined();

		// Step 8: UserInfo request
		const userInfoResponse = await userInfo({
			request: {
				headers: {
					get: (name: string) => (name === 'Authorization' ? `Bearer ${code}` : null)
				}
			}
		} as any);

		const userInfoData = await userInfoResponse.json();
		expect(userInfoData.sub).toBeDefined();
		expect(userInfoData.sub).toContain(await getAddressFromPublicKey(wallet.publicKey));
	});
});
