import { KeyStorage, PrivateKeyStorage } from '../..';
import { SinonStubbedInstance } from 'sinon';
import { IPrivateKeyExporter } from '../../CryptoApi/IPrivateKeyExporter';
import { IKeyStorage } from '../../Sdk/Lib/KeyStorage/IKeyStorage';

describe ('PrivateKeyStorage', () => {
	let privateKeyStorage: PrivateKeyStorage;
	let storageBackendStub: SinonStubbedInstance<IKeyStorage>;
	let privateKeyExporterStub: SinonStubbedInstance<IPrivateKeyExporter>;

	beforeEach(() => {
		storageBackendStub = sinon.createStubInstance(KeyStorage);
		privateKeyExporterStub = {
			exportPrivateKey: sinon.stub(),
			importPrivateKey: sinon.stub()
		};

		privateKeyStorage = new PrivateKeyStorage(privateKeyExporterStub, storageBackendStub);
	});

	describe ('store', () => {
		it ('exports private key data before saving', () => {
			privateKeyExporterStub.exportPrivateKey.returns(Buffer.from('private_key'));
			storageBackendStub.save.resolves();
			return privateKeyStorage.store('test', {}, { meta: 'data' })
				.then(() => {
					assert.isTrue(storageBackendStub.save.calledOnce);
					const storedEntry = storageBackendStub.save.firstCall.args[0];
					assert.equal(storedEntry.name, 'test');
					assert.equal(storedEntry.value.toString(), 'private_key');
					assert.deepEqual(storedEntry.meta, { meta: 'data' });
				});
		});
	});

	describe ('load', () => {
		it ('imports private key data before returning', () => {
			const thePrivateKey = {};
			privateKeyExporterStub.importPrivateKey.returns(thePrivateKey);
			storageBackendStub.load.withArgs('test').resolves({
				name: 'test',
				value: Buffer.from('private_key'),
				meta: { meta: 'data' }
			});

			return privateKeyStorage.load('test').then(loadedEntry => {
				assert.isNotNull(loadedEntry);
				assert.strictEqual(loadedEntry!.privateKey, thePrivateKey);
				assert.deepEqual(loadedEntry!.meta, { meta: 'data' });
			});
		});

		it ('returns null if entry is not found', () => {
			storageBackendStub.load.withArgs('test').resolves(null);
			return assert.becomes(privateKeyStorage.load('test'), null);
		});
	});
});
