import {
	IKeyEntry,
	IKeyEntryStorage,
	IKeyEntryStorageConfig,
	ISaveKeyEntryParams,
	IUpdateKeyEntryParams
} from './IKeyEntryStorage';
import StorageAdapter from './adapters/FileSystemStorageAdapter';
import { IStorageAdapter, IStorageAdapterConfig } from './adapters/IStorageAdapter';
import { KeyEntryAlreadyExistsError } from './KeyEntryAlreadyExistsError';
import { InvalidKeyEntryError } from './InvalidKeyEntryError';
import { KeyEntryDoesNotExistError } from './KeyEntryDoesNotExistError';

const DEFAULTS: IStorageAdapterConfig = {
	dir: '.virgil_key_entries',
	name: 'VirgilKeyEntries'
};

const VALUE_KEY = 'value';
const CREATION_DATE_KEY = 'creationDate';
const MODIFICATION_DATE_KEY = 'modificationDate';

export { IKeyEntry, IKeyEntryStorage, IKeyEntryStorageConfig, ISaveKeyEntryParams, IUpdateKeyEntryParams };

export class KeyEntryStorage implements IKeyEntryStorage {
	private adapter: IStorageAdapter;

	constructor (config: IKeyEntryStorageConfig | string = {}) {
		this.adapter = resolveAdapter(config);
	}

	exists(name: string): Promise<boolean> {
		validateName(name);
		return this.adapter.exists(name);
	}

	load(name: string): Promise<IKeyEntry | null> {
		validateName(name);
		return this.adapter.load(name).then(data => {
			if (data == null) {
				return null;
			}

			return deserializeKeyEntry(data);
		});
	}

	remove(name: string): Promise<boolean> {
		validateName(name);
		return this.adapter.remove(name);
	}

	save({ name, value, meta }: ISaveKeyEntryParams): Promise<IKeyEntry> {
		validateNameProperty(name);
		validateValueProperty(value);

		const keyEntry = {
			name: name,
			value: value,
			meta: meta,
			creationDate: new Date(),
			modificationDate: new Date()
		};

		return this.adapter.store(name, serializeKeyEntry(keyEntry))
			.then(() => keyEntry)
			.catch(error => {
				if (error && error.name === 'StorageEntryAlreadyExistsError') {
					throw new KeyEntryAlreadyExistsError(name);
				}

				throw error;
			});
	}

	list (): Promise<IKeyEntry[]> {
		return this.adapter.list()
			.then(entries => entries.map(entry => deserializeKeyEntry(entry)));
	}

	update ({ name, value, meta }: IUpdateKeyEntryParams): Promise<IKeyEntry> {
		validateNameProperty(name);
		if (!(value || meta)) {
			throw new TypeError(
				'Invalid argument. Either `value` or `meta` property is required.'
			);
		}

		return this.adapter.load(name)
			.then(data => {
				if (data === null) {
					throw new KeyEntryDoesNotExistError(name)
				}

				const entry = deserializeKeyEntry(data);
				const updatedEntry = Object.assign(entry,{
					value: value || entry.value,
					meta: meta || entry.meta,
					modificationDate: new Date()
				});
				return this.adapter.update(name, serializeKeyEntry(updatedEntry))
					.then(() => updatedEntry);
			});
	}
}

function serializeKeyEntry (keyEntry: IKeyEntry): Buffer {
	const { value, ...rest } = keyEntry;
	const serializableEntry = {
		...rest,
		value: value.toString('base64')
	};

	return Buffer.from(JSON.stringify(serializableEntry), 'utf8');
}

function deserializeKeyEntry (data: Buffer): IKeyEntry {
	const dataStr = data.toString('utf8');
	try {
		return JSON.parse(
			dataStr,
			(key, value) => {
				if (key === VALUE_KEY) {
					return Buffer.from(value, 'base64');
				}

				if (key === CREATION_DATE_KEY || key === MODIFICATION_DATE_KEY) {
					return new Date(value);
				}

				return value;
			}
		);
	} catch (error) {
		throw new InvalidKeyEntryError();
	}
}

function resolveAdapter (config: IKeyEntryStorageConfig|string) {
	if (typeof config === 'string') {
		return new StorageAdapter({ dir: config, name: config });
	}

	const { adapter, ...rest } = config;
	if (adapter != null) {
		return adapter;
	}

	return new StorageAdapter({ ...DEFAULTS, ...rest });
}

const requiredArg = (name: string) => (value: any) => {
	if (!value) throw new TypeError(`Argument '${name}' is required.`);
};
const requiredProp = (name: string) => (value: any) => {
	if (!value) throw new TypeError(`Invalid argument. Property ${name} is required`)
};

const validateName = requiredArg('name');
const validateNameProperty = requiredProp('name');
const validateValueProperty = requiredProp('value');
