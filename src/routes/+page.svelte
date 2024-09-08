<script lang="ts">
	import { onMount } from 'svelte';
	import { createSolanaRpc } from '@solana/web3.js';
	import { WalletAdapterNetwork } from '@bewinxed/wallet-adapter-base';
	import { WalletMultiButton } from '@bewinxed/wallet-adapter-svelte-ui';
	import { useSolana } from '@bewinxed/wallet-adapter-svelte';
	import { Cookie } from 'oslo/cookie';
	import type { PageData } from './$types';
	import type { SolanaSignInInput } from '@solana/wallet-standard-features';

	const {
		data
	}: {
		data: PageData;
	} = $props();

	let {
		domain,
		nonce,
		redirect,
		state: pageState,
		oidc_nonce,
		client_id,
		response_type,
		scope
	} = $derived(data);

	let status = $state('Not Logged In');

	const network = WalletAdapterNetwork.Mainnet;
	const endpoint = 'https://api.mainnet-beta.solana.com';

	const solana = useSolana();
	const wallet = $derived(solana.context.wallet);
	const rpc = $derived(solana.rpc);
	let client_metadata: {
		logo_uri?: string;
		client_name?: string;
		client_uri?: string;
	} = $state({});

	onMount(async () => {
		try {
			client_metadata = await fetch(`${window.location.origin}/client/${client_id}`).then(
				(response) => response.json()
			);
		} catch (e) {
			console.error(e);
		}
	});

	async function handleConnect() {
		if (!wallet) {
			throw new Error('Wallet not connected');
		}
		if (wallet?.status !== 'connected') {
			await wallet.connect();
		}

		if (wallet.address) {
			try {
				const issuedAt = new Date().toISOString();
				const expirationTime = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000); // 48h

				const message = {
					domain: window.location.host,
					address: wallet.address,
					statement: `Sign in with Solana to ${client_metadata.client_name || domain}`,
					uri: window.location.origin,
					version: '1',
					chainId: '1', // Solana mainnet
					nonce: nonce,
					issuedAt: issuedAt,
					expirationTime: expirationTime.toISOString(),
					resources: [redirect]
				};

				const encodedMessage = new TextEncoder().encode(JSON.stringify(message));
				const signedMessage = await wallet.signMessage(encodedMessage);

				const session = {
					publicKey: wallet.address,
					message: JSON.stringify(message),
					signature: Array.from(signedMessage) // Convert Uint8Array to regular array for JSON serialization
				};

				const cookie = new Cookie('siws', JSON.stringify(session), {
					expires: expirationTime,
					path: '/',
					sameSite: 'strict',
					secure: true
				});

				document.cookie = cookie.serialize();

				// Redirect to the authorization endpoint
				const authorizationParams = new URLSearchParams({
					response_type: response_type || 'code',
					client_id: client_id,
					redirect_uri: redirect,
					scope: scope || 'openid',
					state: pageState,
					nonce: oidc_nonce || ''
				});

				window.location.href = `/authorize?${authorizationParams.toString()}`;
			} catch (e) {
				console.error(e);
				status = 'Error: ' + (e as Error).message;
			}
		}
	}

	function generateTestParams() {
		const testDomain = 'test.example.com';
		const testNonce = Math.random().toString(36).substring(2, 15);
		const testRedirect = 'https://test.example.com/callback';
		const testState = 'test_state_' + Math.random().toString(36).substring(2, 15);
		const testOidcNonce = Math.random().toString(36).substring(2, 15);
		const testClientId = 'test_client_' + Math.random().toString(36).substring(2, 15);
		const testResponseType = 'code';
		const testScope = 'openid profile';

		const url = new URL(window.location.href);
		url.searchParams.set('domain', testDomain);
		url.searchParams.set('nonce', testNonce);
		url.searchParams.set('redirect_uri', testRedirect);
		url.searchParams.set('state', testState);
		url.searchParams.set('oidc_nonce', testOidcNonce);
		url.searchParams.set('client_id', testClientId);
		url.searchParams.set('response_type', testResponseType);
		url.searchParams.set('scope', testScope);

		window.location.href = url.toString();
	}
</script>

<div
	class="bg-swe-landing flex h-screen w-full flex-grow flex-col flex-wrap items-center justify-center bg-gray bg-cover bg-center bg-no-repeat font-satoshi"
	style="background-image: url('img/swe-landing.svg');"
>
	<div
		class="text-grey flex h-100 w-96 flex-col rounded-20 bg-white p-12 text-center shadow-lg shadow-white"
	>
		{#if client_metadata.logo_uri}
			<div class="flex items-stretch justify-evenly">
				<img
					height="72"
					width="72"
					class="mb-8 self-center"
					src="img/solana_logo.png"
					alt="Solana logo"
				/>
				<img
					height="72"
					width="72"
					class="mb-8 self-center"
					src={client_metadata.logo_uri}
					alt="Client logo"
				/>
			</div>
		{:else}
			<img
				height="72"
				width="72"
				class="mb-8 self-center"
				src="img/solana_logo.png"
				alt="Solana logo"
			/>
		{/if}
		<h5>Welcome</h5>
		<span class="text-xs">
			Sign-In with Solana to continue to {client_metadata.client_name
				? client_metadata.client_name
				: domain}
		</span>

		<WalletMultiButton onconnect={handleConnect} />

		<button
			class="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
			onclick={generateTestParams}
		>
			Generate Test Parameters
		</button>

		<div class="mt-auto self-center text-center text-xs font-semibold">
			By using this service you agree to the <a href="/legal/terms-of-use.pdf">Terms of Use</a>
			and
			<a href="/legal/privacy-policy.pdf">Privacy Policy</a>.
		</div>

		{#if client_metadata.client_uri}
			<span class="mt-4 text-xs">Request linked to {client_metadata.client_uri}</span>
		{/if}
	</div>
</div>

<style global lang="postcss">
	/* Your existing styles */
</style>
