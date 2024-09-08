import { type Address, getBase58Encoder } from '@solana/web3.js';
import { alphabet, generateRandomString } from 'oslo/crypto';
import {
	array,
	custom,
	enum_,
	type InferOutput,
	isoDateTime,
	length,
	maxLength,
	minLength,
	object,
	optional,
	parse,
	pipe,
	regex,
	string,
	url,
	type ValiError
} from 'valibot';
import type { SolanaMessage } from './types';

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
	message: SiwsMessage,
	signature: Uint8Array
): Promise<boolean> {
	console.log('Verifying signature:', message, signature);
	const address = message.address;

	if (!address) {
		throw new Error('Invalid message: missing address');
	}

	return verifySolanaSignature(address as Address, signature, message.toMessage());
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const b58encoder = getBase58Encoder();

enum SolanaSignMessageVersion {
	'1.1.0' = 1.1,
	'1.0.0' = 1.0
}

enum SolanaChainId {
	'mainnet-beta' = 101,
	testnet = 102,
	devnet = 103
}

const isSolanaBase58Address = custom<string>((value) => {
	// @ts-expect-error - value is unknown
	const bytes = b58encoder.encode(value);
	const numBytes = bytes.byteLength;
	if (numBytes !== 32) {
		return false;
	}
	return true;
}, 'Invalid Solana address');

const isSolanaAddress = pipe(
	string(),
	minLength(32, 'Address length is too short'),
	maxLength(44, 'Address length is too long'),
	isSolanaBase58Address
);

export interface VerifyParams {
	/** Signature of the message signed by the wallet */
	signature: string;
	/** RFC 3986 URI scheme for the authority that is requesting the signing. */
	// scheme?: string;
	/** RFC 4501 dns authority that is requesting the signing. */
	domain?: string;
	/** Randomized token used to prevent replay attacks, at least 8 alphanumeric characters. */
	nonce?: string;
	/**ISO 8601 datetime string of the current time. */
	time?: string;
	/** The message that was signed. */
	message: string;
}

type VerifyOpts = {
	suppressExceptions?: boolean;
};

const SiwsMessageSchema = object({
	domain: pipe(string(), url()),
	address: isSolanaAddress,
	uri: pipe(string(), url()),
	version: enum_(SolanaSignMessageVersion),
	// 101: Mainnet-beta, 102: Testnet, 103: Devnet
	chainId: optional(enum_(SolanaChainId)),
	statement: string(),
	nonce: pipe(
		string(),
		length(8, 'Nonce length is invalid'),
		regex(/^[a-zA-Z0-9]$/, 'Invalid nonce')
	),
	issuedAt: optional(pipe(string(), isoDateTime('Invalid ISO 8601 date'))),
	expirationTime: optional(pipe(string(), isoDateTime('Invalid ISO 8601 date'))),
	notBefore: optional(pipe(string(), isoDateTime('Invalid ISO 8601 date'))),
	requestId: optional(string()),
	resources: optional(array(pipe(string(), url())))
});

type SiwsMessageType = InferOutput<typeof SiwsMessageSchema>;

type SiwsMessageImplementation = SiwsMessageType & {
	toMessage(): string;
	prepareMessage(): string;
	verify(params: VerifyParams, opts: VerifyOpts): Promise<boolean>;
	validateMessage(): SiwsMessageType;
};

class SiwsMessage implements SiwsMessageImplementation {
	domain!: string;
	address!: string;
	uri!: string;
	version!: SolanaSignMessageVersion;
	chainId!: SolanaChainId;
	statement!: string;
	nonce!: string;
	issuedAt!: string;
	expirationTime?: string;
	notBefore?: string;
	requestId?: string;
	resources?: string[];

	constructor(params: SiwsMessageType) {
		params.nonce = params.nonce ?? generateNonce();
		Object.assign(this, params);
		Object.assign(this, this.validateMessage());
	}

	async verify({ signature, message }: { signature: string; message: string }): Promise<boolean> {
		const parsedMessage = SiwsMessage.fromMessage(message);
		return await verifySignedSignature(
			parsedMessage,
			Uint8Array.from(new TextEncoder().encode(signature))
		);
	}

	toMessage(): string {
		const header = `${this.domain} wants you to sign in with your Solana account:`;
		const uriField = `URI: ${this.uri}`;
		let prefix = [header, this.address].join('\n');
		const versionField = `Version: ${this.version}`;
		const chainField = `Chain ID: ${this.chainId || '1'}`;
		const nonceField = `Nonce: ${this.nonce}`;
		const suffixArray = [uriField, versionField, chainField, nonceField];
		this.issuedAt = this.issuedAt || new Date().toISOString();
		suffixArray.push(`Issued At: ${this.issuedAt}`);
		if (this.expirationTime) {
			suffixArray.push(`Expiration Time: ${this.expirationTime}`);
		}
		if (this.notBefore) {
			suffixArray.push(`Not Before: ${this.notBefore}`);
		}
		if (this.requestId) {
			suffixArray.push(`Request ID: ${this.requestId}`);
		}
		if (this.resources) {
			suffixArray.push(['Resources:', ...this.resources.map((x) => `- ${x}`)].join('\n'));
		}
		const suffix = suffixArray.join('\n');
		prefix = [prefix, this.statement].join('\n\n');
		if (this.statement) {
			prefix += '\n';
		}
		return [prefix, suffix].join('\n');
	}

	public static fromMessage(message: string): SiwsMessage {
		const parsedMessage = SiwsMessage.parseMessage(message);
		return new SiwsMessage(parsedMessage as SiwsMessageType);
	}

	public static parseMessage(message: string): Partial<SiwsMessageType> {
		const lines = message.split('\n');
		const result: Partial<SiwsMessageType> = {};

		// Parse domain and address
		const headerRegex = /^(.+) wants you to sign in with your Solana account:$/;
		const headerMatch = lines[0].match(headerRegex);
		if (headerMatch) {
			result.domain = headerMatch[1];
		}
		result.address = lines[1];

		// Parse statement (if exists)
		let statementEndIndex = 2;
		while (lines[statementEndIndex] && lines[statementEndIndex] !== '') {
			statementEndIndex++;
		}
		if (statementEndIndex > 2) {
			result.statement = lines.slice(2, statementEndIndex).join('\n');
		}

		// Parse other fields
		for (let i = statementEndIndex + 1; i < lines.length; i++) {
			const line = lines[i];
			if (line.startsWith('URI: ')) {
				result.uri = line.substring(5);
			} else if (line.startsWith('Version: ')) {
				result.version =
					line.substring(9) === '1.0.0'
						? SolanaSignMessageVersion['1.0.0']
						: SolanaSignMessageVersion['1.1.0'];
			} else if (line.startsWith('Chain ID: ')) {
				const chainId = line.substring(10);
				result.chainId =
					chainId === 'mainnet-beta' ||
					Number.parseInt(chainId) === 1 ||
					Number.parseInt(chainId) === 101
						? SolanaChainId['mainnet-beta']
						: chainId === 'testnet' ||
							  Number.parseInt(chainId) === 2 ||
							  Number.parseInt(chainId) === 102
							? SolanaChainId.testnet
							: SolanaChainId.devnet;
			} else if (line.startsWith('Nonce: ')) {
				result.nonce = line.substring(7);
			} else if (line.startsWith('Issued At: ')) {
				result.issuedAt = line.substring(11);
			} else if (line.startsWith('Expiration Time: ')) {
				result.expirationTime = line.substring(17);
			} else if (line.startsWith('Not Before: ')) {
				result.notBefore = line.substring(12);
			} else if (line.startsWith('Request ID: ')) {
				result.requestId = line.substring(12);
			} else if (line === 'Resources:') {
				result.resources = [];
				i++;
				while (i < lines.length && lines[i].startsWith('- ')) {
					result.resources.push(lines[i].substring(2));
					i++;
				}
				i--; // Adjust for the extra increment in the for loop
			}
		}

		return result;
	}
	prepareMessage(): string {
		return this.toMessage();
	}

	validateMessage(): SiwsMessageType {
		try {
			return parse(SiwsMessageSchema, this);
		} catch (e) {
			throw new Error('Invalid message', {
				cause: e as ValiError<typeof SiwsMessageSchema>
			});
		}
	}
}

export { SiwsMessage };
