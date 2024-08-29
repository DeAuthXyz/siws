<script lang="ts">
	import { onMount } from 'svelte';
	import { createSolanaRpc } from '@solana/web3.js';

	import { WalletAdapterNetwork } from '@bewinxed/wallet-adapter-base';
	import { WalletMultiButton } from '@bewinxed/wallet-adapter-svelte-ui';
	import { useSolana } from '@bewinxed/wallet-adapter-svelte';
	import { Cookie } from 'oslo/cookie';
	import type { PageData } from './$types';

	// TODO: REMOVE DEFAULTS:
	// main.ts will parse the params from the server
	const {
		data
	}: {
		data: PageData;
	} = $props();

	const { domain, nonce, redirect, state: pageState, oidc_nonce, client_id } = $derived(data);

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
	} = {};

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
				const expirationTime = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000); // 48h

				const message = `You are signing-in to ${window.location.host}.
Address: ${wallet.address}
Nonce: ${nonce}
Expiration: ${expirationTime.toISOString()}
URI: ${window.location.origin}
Version: 1
Resources: ${redirect}`;

				const encodedMessage = new TextEncoder().encode(message);
				const signedMessage = await wallet.signMessage(encodedMessage);

				const session = {
					publicKey: wallet.address,
					message: message,
					signature: signedMessage
				};

				const cookie = new Cookie('solana_session', JSON.stringify(session), {
					expires: expirationTime
				});

				document.cookie = cookie.serialize();

				let oidc_nonce_param = '';
				if (oidc_nonce != null && oidc_nonce !== '') {
					oidc_nonce_param = `&oidc_nonce=${oidc_nonce}`;
				}

				window.location.replace(
					`/sign_in?redirect_uri=${encodeURI(redirect)}&state=${encodeURI(pageState)}&client_id=${encodeURI(client_id)}${encodeURI(oidc_nonce_param)}`
				);
			} catch (e) {
				console.error(e);
			}
		}
	}
</script>

<div
	class="bg-no-repeat bg-cover bg-center bg-swe-landing font-satoshi bg-gray flex-grow w-full h-screen items-center flex justify-center flex-wrap flex-col"
	style="background-image: url('img/swe-landing.svg');"
>
	<div
		class="w-96 text-center bg-white rounded-20 text-grey flex h-100 flex-col p-12 shadow-lg shadow-white"
	>
		{#if client_metadata.logo_uri}
			<div class="flex justify-evenly items-stretch">
				<img
					height="72"
					width="72"
					class="self-center mb-8"
					src="img/solana_logo.png"
					alt="Solana logo"
				/>
				<img
					height="72"
					width="72"
					class="self-center mb-8"
					src={client_metadata.logo_uri}
					alt="Client logo"
				/>
			</div>
		{:else}
			<img
				height="72"
				width="72"
				class="self-center mb-8"
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

		<div class="self-center mt-auto text-center font-semibold text-xs">
			By using this service you agree to the <a href="/legal/terms-of-use.pdf">Terms of Use</a>
			and
			<a href="/legal/privacy-policy.pdf">Privacy Policy</a>.
		</div>

		{#if client_metadata.client_uri}
			<span class="text-xs mt-4">Request linked to {client_metadata.client_uri}</span>
		{/if}
	</div>
</div>

<style global lang="postcss">
	
</style>
