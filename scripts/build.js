const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const typescript = require('rollup-plugin-typescript2');
const inject = require('rollup-plugin-inject');
const replace = require('rollup-plugin-replace');
const uglify = require('rollup-plugin-uglify');
const builtinModules = require('builtin-modules');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));
const mkdirp = promisify(require('mkdirp'));
const path = require('path');
const { rollup } = require('rollup');

const BROWSER_ONLY_PLUGINS = [
	inject({
		include: '**/*.ts',
		exclude: 'node_modules/**',
		modules: {
			Buffer: [ 'buffer', 'Buffer' ]
		}
	})
];

const NODE = 'NODE';
const BROWSER = 'BROWSER';
const BROWSER_PROD = 'BROWSER_PROD';

const virgilSdk = {
	path: '.',
	filename: 'virgil-sdk',
	global: 'Virgil',
	bundleTypes: [ NODE, BROWSER, BROWSER_PROD ]
};

function createBundle(bundle) {
	const pkg = require(path.resolve(bundle.path, 'package.json'));

	return Promise.resolve()
		.then(() => rimraf(path.resolve(bundle.path, 'dist')))
		.then(() => mkdirp(path.resolve(bundle.path, 'dist')))
		.then(() => {
			return Promise.all(bundle.bundleTypes.map(bundleType => {
				const isBrowser = bundleType !== NODE;
				const isProd = bundleType === BROWSER_PROD;

				const browserEntry = typeof pkg.browser === 'object' && pkg.browser['./src/index.ts']
					? pkg.browser['./src/index.ts']
					: 'src/index.ts';

				const entry = isBrowser ? browserEntry : 'src/index.ts';

				// ingore built-ins in node,
				// include buffer in browser bundles
				const externalModules = isBrowser ? [] : builtinModules;

				return rollup({
					input: path.resolve(bundle.path, entry),
					external: externalModules,
					// moduleContext: {
					// 	'whatwg-fetch': 'window'
					// },
					plugins: [
						resolve({
							browser: isBrowser,
							jsnext: true,
							extensions: [ '.ts', '.js' ],
							include: 'src/**/*.ts',
							preferBuiltins: !isBrowser
						}),

						typescript({
							useTsconfigDeclarationDir: true,
							tsconfigOverride: {
								compilerOptions: {
									module: 'es2015'
								}
							}
						}),

						replace({ 'process.browser': JSON.stringify(isBrowser) }),

						...(isBrowser ? BROWSER_ONLY_PLUGINS : []),

						commonjs({
							ignore: externalModules
						}),

						...(isProd
							? [ uglify() ]
							: []
						)
					]
				}).then(output => {
					const formats = getOutputFormatsFromBundleType(bundleType);
					return Promise.all(formats.map(format => {
						const file = getOutpupFilenameFormBundleType(bundle.filename, format, bundleType);
						return output.write({
							format: format,
							name: bundle.global,
							file: path.resolve(bundle.path, file)
						}).then(() => {
							console.log('  \u2713' + ' wrote ' +
								path.basename(path.resolve(bundle.path)) + '/' + file);
						})
					}))
				});
			}));
		});
}

function getOutpupFilenameFormBundleType(filename, format, bundleType) {
	switch (bundleType) {
		case NODE:
			return `dist/${filename}.${format}.js`;
		case BROWSER:
			return `dist/${filename}.browser.${format}.js`;
		case BROWSER_PROD:
			return `dist/${filename}.browser.${format}.min.js`;
	}
}

function getOutputFormatsFromBundleType(bundleType) {
	switch (bundleType) {
		case NODE:
			return [ 'cjs', 'es' ];
		case BROWSER:
			return [ 'umd', 'cjs', 'es' ];
		case BROWSER_PROD:
			return [ 'umd' ];
	}
}

function bundleVirgilSdk() {
	return createBundle(virgilSdk);
}

function build() {
	return bundleVirgilSdk()
		.catch(e => console.error(e));
}

if (require.main === module) {
	build();
} else {
	module.exports = build;
}
