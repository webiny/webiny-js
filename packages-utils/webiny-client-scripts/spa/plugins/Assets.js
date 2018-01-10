const _ = require('lodash');
const crypto = require('crypto');
const {ConcatSource} = require('webpack-sources');
const NormalModule = require('webpack/lib/NormalModule');

const appJs = new RegExp('app([-0-9a-z]+)?.js$');
const vendorJs = new RegExp('vendor([-0-9a-z]+)?.js$');
const appCss = new RegExp('app([-0-9a-z]+)?.css$');

class AssetsPlugin {
    constructor(options) {
        this.options = options || {};
        this.manifestVariable = options.manifestVariable || 'webpackManifest';
        this.assetRules = options.assetRules || [];
    }

    replaceChunkFile(chunk, file, source, nameFn) {
        const fileIndex = chunk.files.indexOf(file);
        // Remove old asset file
        delete this.compilation.assets[file];
        file = nameFn(this.createSourceHash(source));
        this.compilation.assets[file] = source;
        chunk.files[fileIndex] = file;
        return file;
    }

    createSourceHash(source, length = 10) {
        // Create hash based on new file contents
        const hash = crypto.createHash('md5');
        source.updateHash(hash);
        return hash.digest('hex').substr(0, length);
    }

    apply(compiler) {
        const outputName = 'meta.json';
        const cache = {};

        compiler.plugin('emit', (compilation, compileCallback) => {
            this.compilation = compilation;
            let meta = {
                name: compiler.name
            };
            
            compilation.chunks.forEach(chunk => {
                chunk.files.forEach(file => {
                    // Don't add hot updates to meta
                    if (file.indexOf('hot-update') >= 0) {
                        return;
                    }

                    const fileSource = compilation.assets[file];

                    if (file.startsWith('chunks/')) {
                        meta.chunks = meta.chunks || {};
                        if (process.env.NODE_ENV === 'production') {
                            // Add chunk hint to source for easier debugging
                            const chunkName = `/* ${this.generateChunkName(chunk)} */`;
                            const newSource = new ConcatSource(chunkName, fileSource);
                            meta.chunks[chunk.id] = this.replaceChunkFile(chunk, file, newSource, hash => `chunks/${hash}.js`);
                        } else {
                            meta.chunks[chunk.id] = file;
                        }
                        return;
                    }

                    if (appJs.test(file) && !file.startsWith('chunks/')) {
                        if (process.env.NODE_ENV === 'production') {
                            meta['app'] = this.replaceChunkFile(chunk, file, fileSource, hash => `app-${hash}.js`);
                        } else {
                            meta['app'] = file;
                        }
                        return;
                    }

                    if (vendorJs.test(file) && !file.startsWith('chunks/')) {
                        if (process.env.NODE_ENV === 'production') {
                            meta['vendor'] = this.replaceChunkFile(chunk, file, fileSource, hash => `vendor-${hash}.js`);
                        } else {
                            meta['vendor'] = file;
                        }
                        return;
                    }

                    if (appCss.test(file)) {
                        if (process.env.NODE_ENV === 'production') {
                            meta['css'] = this.replaceChunkFile(chunk, file, fileSource, hash => `css-${hash}.css`);
                        } else {
                            meta['css'] = file;
                        }
                    }
                });
            });

            // Append publicPath onto all references.
            // This allows output path to be reflected in the meta file.
            if (process.env.NODE_ENV === 'production') {
                const urlKeys = ['app', 'vendor', 'css', 'chunks'];
                meta = _.reduce(meta, (result, value, key) => {
                    if (!urlKeys.includes(key)) {
                        result[key] = value;
                        return result;
                    }

                    if (key === 'chunks') {
                        const chunks = {};
                        _.each(value, (chkValue, chkKey) => {
                            chunks[chkKey] = this.generateUrl(chkValue);
                        });
                        result[key] = chunks;
                    } else {
                        result[key] = this.generateUrl(value);
                    }
                    return result;
                }, {});
            } else {
                const urlKeys = ['app', 'vendor', 'css'];
                meta = _.reduce(meta, (result, value, key) => {
                    result[key] = urlKeys.includes(key) ? compiler.options.output.publicPath + value : value;
                    return result;
                }, {});
            }

            Object.keys(meta).sort().forEach(key => {
                cache[key] = meta[key];
            });

            const json = JSON.stringify(cache, null, 2);

            compilation.assets[outputName] = {
                source: () => json,
                size: () => json.length
            };

            compileCallback();
        });

        let oldChunkFilename;
        let manifestVariable = this.manifestVariable;

        compiler.plugin("this-compilation", function (compilation) {
            const mainTemplate = compilation.mainTemplate;
            mainTemplate.plugin("require-ensure", function (_) {
                const filename = this.outputOptions.chunkFilename || this.outputOptions.filename;

                if (filename) {
                    oldChunkFilename = this.outputOptions.chunkFilename;
                    this.outputOptions.chunkFilename = "__CHUNK_MANIFEST__";
                }

                return _;
            });
        });

        compiler.plugin("compilation", function (compilation) {
            // Replace placeholder with custom variable for manifest json
            compilation.mainTemplate.plugin("require-ensure", function (_, chunk, hash, chunkIdVar) {
                if (oldChunkFilename) {
                    this.outputOptions.chunkFilename = oldChunkFilename;
                }

                return _.replace("\"__CHUNK_MANIFEST__\"", manifestVariable + "[" + chunkIdVar + "]");
            });
        });
    }

    generateUrl(file) {
        let prefix = '/';

        _.each(this.assetRules, rule => {
            const regex = new RegExp(rule.test);
            if (regex.test(file)) {
                prefix = rule.domain + prefix;
                return false;
            }
        });

        return prefix + '/' + file;
    }

    generateChunkName(chunk) {
        const chunkModules = chunk.mapModules(m => m).filter(this.filterJsModules).sort(this.sortByIndex);
        const filteredModules = chunkModules.filter(m => !m.resource.includes('/node_modules/'));
        let chunkName = _.get(filteredModules, '0.resource', _.get(chunkModules, '0.resource', 'undefined')).split(this.options.projectRoot).pop();
        chunkName = chunkName.split('_').slice(-3, -1).join('_');
        return chunkName.replace('/index.js', '');
    }

    sortByIndex(a, b) {
        return a.index - b.index;
    }

    filterJsModules(m) {
        if (m instanceof NormalModule) {
            return m.resource.endsWith('.js') || m.resource.endsWith('.jsx');
        }

        return false;
    }
}

module.exports = AssetsPlugin;