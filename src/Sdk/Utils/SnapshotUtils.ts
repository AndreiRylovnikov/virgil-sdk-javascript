import { IExtraData } from '../ICard';
import { IPrivateKey } from '../../CryptoApi/IPrivateKey';

export interface ICardParams {
	readonly identity: string;
	readonly publicKey: Buffer;
	readonly privateKey?: IPrivateKey;
	readonly previousCardId?: string;
	readonly extraFields?: IExtraData;
	readonly createdAt?: Date;
	readonly version?: string;
}

export function takeSnapshot (info: ICardParams): Buffer {
	return Buffer.from( JSON.stringify(info), 'utf8' );
}

export function parseSnapshot (snapshot: Buffer): ICardParams {
	return JSON.parse( snapshot.toString('utf8') );
}