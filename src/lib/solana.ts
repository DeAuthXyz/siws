import { type Address, getBase58Encoder } from '@solana/web3.js';
import type { SolanaSignInInput } from '@solana/wallet-standard-features';
import type { SolanaMessage } from './types';
import { alphabet, generateRandomString } from 'oslo/crypto';

async function verifySolanaSignature(
	address: Address,
	signature: Uint8Array,
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
	message: string,
	signature: Uint8Array
): Promise<boolean> {
	console.log('Verifying signature:', message, signature);

	const parsedMessage: SolanaSignInInput = JSON.parse(message);
	const address = parsedMessage.address;

	if (!address) {
		throw new Error('Invalid message: missing address');
	}

	return verifySolanaSignature(address as Address, signature, message);
}

export async function resolveUsername(address: string): Promise<string | null> {
	// Implement your username resolution logic here
	// If no username is found, return the address itself or null
	try {
		// Your resolution logic here
		// For now, we'll just return the address
		return address;
	} catch (error) {
		console.error('Error resolving username:', error);
		return null;
	}
}

export async function resolveAvatar(address: string): Promise<string | null> {
	// Implement your avatar resolution logic here
	// If no avatar is found, return null
	try {
		// Your resolution logic here
		// For now, we'll return null
		return null;
	} catch (error) {
		console.error('Error resolving avatar:', error);
		return null;
	}
}

export function toSignMessage(message: SolanaMessage): string {
	return `domain: ${message.domain}\naddress: ${message.address}\nstatement: ${message.statement}\nuri: ${message.uri}\nversion: ${message.version}\nnonce: ${message.nonce}\nissued_at: ${message.issued_at}`;
}

/**
 * This method leverages a native CSPRNG with support for both browser and Node.js
 * environments in order generate a cryptographically secure nonce for use in the
 * SiweMessage in order to prevent replay attacks.
 *
 * 96 bits has been chosen as a number to sufficiently balance size and security considerations
 * relative to the lifespan of it's usage.
 *
 * @returns cryptographically generated random nonce with 96 bits of entropy encoded with
 * an alphanumeric character set.
 */
export function generateNonce() {
	const nonce = generateRandomString(8, alphabet('a-z', '0-9'));
	if (!nonce || nonce.length < 8) {
		throw new Error('Error during nonce creation.');
	}
	return nonce;
}
