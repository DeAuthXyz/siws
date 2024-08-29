// import { address, type Address, type Rpc } from '@solana/web3.js';
// // import { TldParser as ANSTLDParser } from '@onsol/tldparser';
// import { getProfilePicture as getProfilePictureUsingSolanaPFPStandardUpstream } from '@solflare-wallet/pfp';

// interface WalletNameAndProfilePicture {
// 	walletName: string | null;
// 	profilePicture: string | null;
// }
// interface WalletAddressAndProfilePicture {
// 	walletAddress: string | null;
// 	profilePicture: string | null;
// }

// const removeExtension = (string: string, extension: string): string => {
// 	const extensionWithDot = `.${extension}`;
// 	if (string.endsWith(extensionWithDot)) {
// 		return string.split(extensionWithDot)[0];
// 	}
// 	return string;
// };

// const dotGlowToWalletAddress = async (
// 	dotGlowDomain: string
// ): Promise<WalletAddressAndProfilePicture> => {
// 	const dotGlowUserName = removeExtension(dotGlowDomain, 'glow');
// 	const { body } = (await fetch(
// 		`https://api.glow.app/glow-id/resolve?handle=${dotGlowUserName}`
// 	).then((response) => response.json())) as {
// 		body: {
// 			info?: {
// 				resolved?: string;
// 				image?: string;
// 			};
// 		};
// 	};
// 	const walletAddress = body?.info?.resolved || null;
// 	const profilePicture = body?.info?.image || null;
// 	return {
// 		walletAddress,
// 		profilePicture
// 	};
// };
// const walletAddressToDotGlow = async (wallet: Address): Promise<WalletAddressAndProfilePicture> => {
// 	const walletString = wallet;
// 	const { body } = await fetch(`https://api.glow.app/glow-id/resolve?wallet=${walletString}`);
// 	const dotGlowUsername = body?.info?.handle || null;
// 	const walletName = `${dotGlowUsername}.glow`;
// 	const profilePicture = body?.info?.image || null;
// 	return {
// 		walletName,
// 		profilePicture
// 	};
// };
// const dotSolToWalletAddress = async (dotSolDomain): Promise<WalletAddressAndProfilePicture> => {
// 	try {
// 		const { body } = await http.get(
// 			`https://sns-sdk-proxy.bonfida.workers.dev/resolve/${dotSolDomain}`
// 		);
// 		let walletAddress = null;
// 		const result = body?.result;
// 		if (result !== 'Domain not found') {
// 			walletAddress = result;
// 		}
// 		return {
// 			walletAddress,
// 			profilePicture: null
// 		};
// 	} catch (thrownObject) {
// 		const error = thrownObject;
// 		if (error.message === 'Invalid name account provided') {
// 			return {
// 				walletAddress: null,
// 				profilePicture: null
// 			};
// 		}
// 		throw error;
// 	}
// };
// const walletAddressToDotSol = async (
// 	rpc: Rpc,
// 	wallet: Address
// ): Promise<WalletNameAndProfilePicture> => {
// 	try {
// 		const { body } = await http.get(
// 			// See https://github.com/Bonfida/sns-sdk#sdk-proxy
// 			// There's a 'favorite-domain' endpoint butmost SNS users haven't set up a
// 			// favorite domain, as the UI to do so is complex
// 			// `https://sns-sdk-proxy.bonfida.workers.dev/favorite-domain/${wallet.toBase58()}`
// 			`https://sns-sdk-proxy.bonfida.workers.dev/domains/${wallet}`
// 		);
// 		let walletName = null;
// 		const firstDomainNoSuffix = body?.result?.[0]?.domain;
// 		if (firstDomainNoSuffix) {
// 			walletName = `${firstDomainNoSuffix}.sol`;
// 		}
// 		return {
// 			walletName,
// 			profilePicture: null
// 		};
// 	} catch (thrownObject) {
// 		const error = thrownObject;
// 		if (error.message === 'Invalid wallet account provided') {
// 			return {
// 				walletName: null,
// 				profilePicture: null
// 			};
// 		}
// 		throw error;
// 	}
// };
// const dotBackpackToWalletAddress = async (
// 	dotBackpackDomainName: string,
// 	jwt = null
// ): Promise<WalletAddressAndProfilePicture> => {
// 	const dotBackpackUserName = removeExtension(dotBackpackDomainName, 'backpack');
// 	if (!jwt) {
// 		const { body: body2 } = (await fetch(
// 			`https://backpack-api.xnfts.dev/users/${dotBackpackUserName}`
// 		).then((response) => response.json())) as {
// 			body: {
// 				publicKeys?: {
// 					blockchain?: string;
// 					publicKey?: string;
// 				}[];
// 			};
// 		};
// 		const publicKeysDetails2 = body2?.publicKeys || null;
// 		const firstPublicKeyDetails = publicKeysDetails2?.at(0);
// 		const walletAddress2 = firstPublicKeyDetails?.publicKey || null;
// 		return {
// 			walletAddress: walletAddress2,
// 			profilePicture: null
// 		};
// 	}
// 	const { body } = (await fetch(
// 		`https://backpack-api.xnfts.dev/users?usernamePrefix=${dotBackpackUserName}&blockchain=solanalimit=6`,
// 		{
// 			headers: {
// 				cookie: `jwt=${jwt}`
// 			}
// 		}
// 	).then((response) => response.json())) as {
// 		body: {
// 			users?: {
// 				username?: string;
// 				image?: string;
// 				public_keys?: {
// 					blockchain?: string;
// 					publicKey?: string;
// 				}[];
// 			}[];
// 		};
// 	};
// 	const users = body?.users || null;
// 	if (!users) {
// 		return {
// 			walletAddress: null,
// 			profilePicture: null
// 		};
// 	}
// 	const matchingUser = users.find((user) => user.username === dotBackpackUserName);
// 	const profilePicture = matchingUser?.image || null;
// 	if (!matchingUser) {
// 		return {
// 			walletAddress: null,
// 			profilePicture: null
// 		};
// 	}
// 	const publicKeysDetails = matchingUser.public_keys || null;
// 	if (!publicKeysDetails?.length) {
// 		return {
// 			walletAddress: null,
// 			profilePicture: null
// 		};
// 	}
// 	const solanaPublicKeyDetails = publicKeysDetails.find((publicKeyDetails) => {
// 		return publicKeyDetails.blockchain === 'solana';
// 	});
// 	if (!solanaPublicKeyDetails) {
// 		return {
// 			walletAddress: null,
// 			profilePicture: null
// 		};
// 	}
// 	const walletAddress = solanaPublicKeyDetails.publicKey || null;
// 	return {
// 		walletAddress,
// 		profilePicture
// 	};
// };
// const walletAddressToDotBackpack = async (
// 	wallet: Address,
// 	jwt = null
// ): Promise<WalletNameAndProfilePicture> => {
// 	if (!jwt) {
// 		return {
// 			walletName: null,
// 			profilePicture: null
// 		};
// 	}
// 	const walletString = wallet;
// 	const backpackAPIEndpoint = `https://backpack-api.xnfts.dev/users?usernamePrefix=${walletString}`;
// 	const { body } = await fetch(backpackAPIEndpoint, {
// 		headers: {
// 			cookie: `jwt=${jwt}`
// 		}
// 	}).then(
// 		(response) =>
// 			response.json() as {
// 				body: {
// 					users?: {
// 						username?: string;
// 						image?: string;
// 					}[];
// 				};
// 			}
// 	);

// 	const users = body?.users || null;
// 	if (!users?.length) {
// 		return {
// 			walletName: null,
// 			profilePicture: null
// 		};
// 	}
// 	const firstUser = users[0];
// 	const username = firstUser.username;
// 	const profilePicture = firstUser.image || null;
// 	const domainName = `${username}.backpack`;
// 	return {
// 		walletName: domainName,
// 		profilePicture
// 	};
// };
// const walletNameToAddressAndProfilePicture = async (
// 	rpc: Rpc,
// 	walletName: string,
// 	jwt = null
// ): Promise<WalletAddressAndProfilePicture> => {
// 	let walletAddressAndProfilePicture: WalletAddressAndProfilePicture = {
// 		walletAddress: null,
// 		profilePicture: null
// 	};
// 	const parts = walletName.split('.');
// 	if (parts.length < 2) {
// 		return walletAddressAndProfilePicture;
// 	}
// 	if (walletName.endsWith('.sol')) {
// 		walletAddressAndProfilePicture = await dotSolToWalletAddress(walletName);
// 	}
// 	if (walletName.endsWith('.glow')) {
// 		walletAddressAndProfilePicture = await dotGlowToWalletAddress(walletName);
// 	}
// 	if (walletName.endsWith('.backpack')) {
// 		walletAddressAndProfilePicture = await dotBackpackToWalletAddress(walletName, jwt);
// 	}
// 	if (
// 		walletAddressAndProfilePicture.walletAddress &&
// 		!walletAddressAndProfilePicture.profilePicture
// 	) {
// 		const solanaPFPUrl = await getProfilePictureUsingSolanaPFPStandard(
// 			rpc,
// 			address(walletAddressAndProfilePicture.walletAddress)
// 		);
// 		walletAddressAndProfilePicture.profilePicture = solanaPFPUrl || null;
// 	}
// 	return walletAddressAndProfilePicture;
// };
// const walletAddressToNameAndProfilePicture = async (
// 	rpc: Rpc,
// 	wallet: Address,
// 	backpackJWT = null
// ): Promise<WalletAddressAndProfilePicture> => {
// 	const dotSol = await walletAddressToDotSol(rpc, wallet);
// 	dotSol.profilePicture = solanaPFPStandardImageURL || null;
// 	if (dotSol?.walletName && dotSol?.profilePicture) {
// 		return dotSol;
// 	}
// 	const dotGlow = await walletAddressToDotGlow(wallet);
// 	if (dotGlow?.walletName && dotGlow?.profilePicture) {
// 		return dotGlow;
// 	}
// 	if (backpackJWT) {
// 		const dotBackpack = await walletAddressToDotBackpack(wallet, backpackJWT);
// 		if (dotBackpack?.walletName && dotBackpack?.profilePicture) {
// 			return dotBackpack;
// 		}
// 	}
// 	return {
// 		walletName: null,
// 		profilePicture: null
// 	};
// };

// export {
// 	dotBackpackToWalletAddress,
// 	dotGlowToWalletAddress,
// 	dotSolToWalletAddress,
// 	walletAddressToDotBackpack,
// 	walletAddressToDotGlow,
// 	walletAddressToDotSol,
// 	walletAddressToNameAndProfilePicture,
// 	walletNameToAddressAndProfilePicture
// };
// //# sourceMappingURL=index.mjs.map
