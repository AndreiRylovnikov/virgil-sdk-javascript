export interface IStorageAdapterConfig {
	dir: string;
	name: string;
}

export interface IStorageAdapter {
	store (key: string, data: Buffer): Promise<void>;
	load (key: string): Promise<Buffer|null>;
	exists (key: string): Promise<boolean>;
	remove (key: string): Promise<boolean>;
	update (key: string, data: Buffer): Promise<void>;
	clear (): Promise<void>;
	list (): Promise<Buffer[]>;
}
