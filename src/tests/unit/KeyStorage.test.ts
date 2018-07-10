import { SinonStubbedInstance } from 'sinon';
import { KeyStorage } from '../..';
import FileSystemStorageAdapter from '../../Sdk/Lib/KeyStorage/adapters/FileSystemStorageAdapter';
import { PrivateKeyExistsError } from '../../Sdk/Lib/KeyStorage/PrivateKeyExistsError';

describe ('KeyStorage', () => {
	let storage: KeyStorage;
	let adapterSub: SinonStubbedInstance<FileSystemStorageAdapter>;

	beforeEach(() => {
		adapterSub = sinon.createStubInstance(FileSystemStorageAdapter);
		storage = new KeyStorage({
			adapter: adapterSub
		});
	});

	describe ('exists', () => {
		it ('throws if name is empty', () => {
			assert.throws(() => {
				// should throw synchronously
				storage.exists('');
			}, TypeError);
		});

		it ('queries the adapter', () => {
			adapterSub.exists.resolves(true);
			return storage.exists('one').then(exists => {
				assert.isTrue(exists);
				assert.isTrue(adapterSub.exists.withArgs('one').calledOnce);
			});
		});
	});

	describe ('save', () => {
		it ('throws if `keyEntry` is empty', () => {
			assert.throws(() => {
				storage.save(null!);
			}, TypeError);
		});

		it ('throws if `keyEntry.name` is empty', () => {
			assert.throws(() => {
				storage.save({ name: '', value: Buffer.from('one') });
			}, TypeError);
		});

		it ('throws if `keyEntry.value` is empty', () => {
			assert.throws(() => {
				storage.save({ name: 'one', value: null! })
			}, TypeError);
		});

		it ('serializes entry to json and forwards to adapter', () => {
			adapterSub.store.resolves();
			const expectedName = 'one';
			const expectedValue = Buffer.from('one');
			const expectedMeta = { meta: 'data' };

			return storage.save({
				name: expectedName,
				value: expectedValue,
				meta: expectedMeta }
			).then(() => {
				assert.equal(adapterSub.store.firstCall.args[0], expectedName);
				assert.isTrue(Buffer.isBuffer(adapterSub.store.firstCall.args[1]));

				const storedObject = JSON.parse(adapterSub.store.firstCall.args[1].toString());
				assert.equal(storedObject.name, expectedName);
				assert.equal(storedObject.value, expectedValue.toString('base64'));
				assert.deepEqual(storedObject.meta, expectedMeta);
			});
		});

		it ('throws `PrivateKeyExistsError` if entry with the same name already exists', () => {
			adapterSub.store.rejects({ code: 'EEXIST' });
			return assert.isRejected(
				storage.save({name: 'one', value: Buffer.from('one') }),
				PrivateKeyExistsError
			);
		});

		it ('re-throws unexpected errors from adapter', () => {
			adapterSub.store.rejects({ code: 'UNKNOWN', message: 'unknown error' });
			return assert.isRejected(
				storage.save({name: 'one', value: Buffer.from('one') }),
				/unknown error/
			);
		});
	});

	describe ('load', () => {
		it ('throws if name is empty', () => {
			assert.throws(() => {
				// should throw synchronously
				storage.load('');
			}, TypeError);
		});

		it ('returns null if entry is not found', () => {
			adapterSub.load.withArgs('any').resolves(null);
			return assert.becomes(storage.load('any'), null);
		});

		it ('de-serializes entry returned from adapter', () => {
			adapterSub.load.withArgs('one')
				.resolves(Buffer.from('{"name":"one","value":"b25l"}')); // "b25l" === base64("one")
			return storage.load('one').then(loadedEntry => {
				assert.isNotNull(loadedEntry);
				assert.equal(loadedEntry!.name, 'one');
				assert.isTrue(loadedEntry!.value.equals(Buffer.from('one')));
			});
		});

		it ('de-serializes entries stored in older format', () => {
			adapterSub.load.withArgs('one').resolves(Buffer.from('not_json'));
			return storage.load('one').then(loadedEntry => {
				assert.isNotNull(loadedEntry);
				assert.equal(loadedEntry!.name, 'one', 'uses user-provided string as the name');
				assert.isTrue(
					loadedEntry!.value.equals(Buffer.from('not_json')),
					'uses the stored value as value'
				);
			})
		});
	});

	describe ('list', () => {
		it ('de-serializes entries returned from adapter', () => {
			adapterSub.list.resolves([
				{ key: '', value: Buffer.from('{"name":"one","value":"b25l"}') }, // "b25l" === base64("one")
				{ key: '', value: Buffer.from('{"name":"two","value":"dHdv"}') }, // "dHdv" === base64("two")
				{ key: '', value: Buffer.from('{"name":"three","value":"dGhyZWU="}') } // "dGhyZWU=" === base64("three")
			]);

			const expectedEntries = [
				{ name: 'one', value: Buffer.from('one') },
				{ name: 'two', value: Buffer.from('two') },
				{ name: 'three', value: Buffer.from('three') },
			];

			return storage.list().then(loadedEntries => {
				assert.equal(loadedEntries.length, 3);
				assert.sameDeepMembers(loadedEntries, expectedEntries);
			});
		});

		it ('de-serializes entries in older format returned from adapter', () => {
			adapterSub.list.resolves([
				{ key: '', value: Buffer.from('one') },
				{ key: '', value: Buffer.from('two') },
				{ key: '', value: Buffer.from('{"name":"three","value":"dGhyZWU="}') } // "dGhyZWU=" === base64("three")
			]);

			const expectedEntries = [
				{ name: '', value: Buffer.from('one') },
				{ name: '', value: Buffer.from('two') },
				{ name: 'three', value: Buffer.from('three') },
			];

			return storage.list().then(loadedEntries => {
				assert.equal(loadedEntries.length, 3);
				assert.sameDeepMembers(loadedEntries, expectedEntries);
			});
		});
	});
});
