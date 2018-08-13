import { RawSignedModel } from './RawSignedModel';
import { IPrivateKey } from '../CryptoApi/IPrivateKey';
import { ICardCrypto } from '../CryptoApi/ICardCrypto';
import { IExtraData } from '../ICard';
import { takeSnapshot } from '../Utils/SnapshotUtils';
import { SelfSigner } from './signer-types';

/**
 * Parameters for the card signature generation.
 */
export interface IRawSignParams {
	/**
	 * The card to generate the signature for in the form of
	 * {@link RawSignedModel} object.
	 */
	readonly model: RawSignedModel;

	/**
	 * The private key to use to generate the signature.
	 */
	readonly signerPrivateKey: IPrivateKey;

	/**
	 * Custom attributes to associate with the signature. If provided, these
	 * will also be signed.
	 */
	readonly extraFields?: IExtraData;

	/**
	 * Identifier of the signature. Default is "self".
	 */
	readonly signer?: string;
}

/**
 * @hidden
 */
interface IFinalSignParams {
	readonly model: RawSignedModel;
	readonly signerPrivateKey: IPrivateKey;
	readonly extraSnapshot?: string;
	readonly signer: string;
}

/**
 * Class responsible for generating signatures of the cards.
 */
export class ModelSigner {

	/**
	 * Initializes a new instance of `ModelSigner`.
	 * @param {ICardCrypto} crypto - Object implementing the
	 * {@link ICardCrypto} interface.
	 */
	public constructor (private readonly crypto: ICardCrypto) {}

	/**
	 * Generates a new signature based on `rawParams`.
	 * @param {IRawSignParams} rawParams
	 */
	public sign (rawParams: IRawSignParams) {
		const { model, signerPrivateKey, signer, extraSnapshot } = this.prepareParams(rawParams);

		const signedSnapshot = extraSnapshot != null
			? model.contentSnapshot + extraSnapshot
			: model.contentSnapshot;

		const signature = this.crypto.generateSignature(signedSnapshot, signerPrivateKey);

		model.signatures.push({
			signer,
			signature: signature.toString('base64'),
			snapshot: extraSnapshot
		});
	}

	private prepareParams ({ model, signerPrivateKey, extraFields, signer }: IRawSignParams): IFinalSignParams {
		signer = signer || SelfSigner;

		let extraSnapshot;
		if (extraFields != null) {
			extraSnapshot = takeSnapshot(extraFields);
		}

		const final: IFinalSignParams = { model, signerPrivateKey, signer, extraSnapshot };

		this.validate(final);

		return final;
	}

	private validate ({ model, signerPrivateKey, signer }: IFinalSignParams) {
		if (model == null) {
			throw new Error("Model is empty");
		}

		if (signerPrivateKey == null) {
			throw new Error("`signerPrivateKey` property is mandatory");
		}

		if (model.signatures != null && model.signatures.some(s => s.signer == signer)) {
			throw new Error("The model already has this signature.");
		}
	}

}
