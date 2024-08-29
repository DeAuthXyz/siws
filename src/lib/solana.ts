import { type Address, type SignatureBytes, getBase58Encoder } from '@solana/web3.js';
// import { Address, createSolanaRpc, Rpc } from '@solana/web3.js';
import type { SolanaMessage } from './types';
// import { walletNameToAddressAndProfilePicture } from './walletNames';

async function verifySolanaSignature(
	address: Address,
	signature: SignatureBytes,
	message: string
): Promise<boolean> {
	// Convert the address string to a Uint8Array
	const addressBytes = getBase58Encoder().encode(address);

	// Ensure we have the correct 32-byte public key
	console.log(addressBytes);
	if (addressBytes.length !== 32) {
		throw new Error('Invalid address: must decode to 32 bytes');
	}

	// Import the public key
	const cryptoKey = await crypto.subtle.importKey('raw', addressBytes, { name: 'Ed25519' }, false, [
		'verify'
	]);

	console.log(cryptoKey);

	const signatureArray =
		signature instanceof Uint8Array ? signature : new Uint8Array(Object.values(signature));

	// Verify the signature
	return await crypto.subtle.verify(
		'Ed25519',
		cryptoKey,
		signatureArray,
		new TextEncoder().encode(message)
	);
}

// mock CryptoKey from public key string
export async function verifySignedSignature(
	message: SolanaMessage,
	signature: SignatureBytes
): Promise<boolean> {
	console.log('Verifying signature:', message, signature);

	return verifySolanaSignature(message.address, signature, JSON.stringify(message));
	// return true;
}

export async function resolveUsername(address: string): Promise<string> {
	// In a real implementation, you might query the Solana blockchain or a name service
	// to resolve a username for the given address. For now, we'll just return the address.
	return address;
}

export async function resolveAvatar(address: string): Promise<string | undefined> {
	// In a real implementation, you might query the Solana blockchain or a profile service
	// to resolve an avatar for the given address. For now, we'll return undefined.
	return undefined;
}
