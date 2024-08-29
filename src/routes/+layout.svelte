<script lang="ts">
	import '../app.css';
	import { ConnectionProvider, WalletProvider } from '@bewinxed/wallet-adapter-svelte';
	import { WalletModalProvider, WalletMultiButton } from '@bewinxed/wallet-adapter-svelte-ui';
	import { onMount } from 'svelte';
	const { children } = $props();
</script>

<ConnectionProvider
	endpoint="https://api.mainnet-beta.solana.com"
	config={{ defaultCommitment: 'confirmed' }}
>
	<WalletProvider wallets={[]}>
		<WalletModalProvider>
			{@render children()}
		</WalletModalProvider>
	</WalletProvider>
</ConnectionProvider>
