import _ from 'lodash';
import crypto from 'crypto';
import chalk from 'chalk';
import Webiny from 'webiny-cli/lib/webiny';
import SizeFormatHelpers from 'webpack/lib/SizeFormatHelpers';

const {magenta, yellow} = chalk;

function sortByIndex(a, b) {
    return a.index - b.index;
}

class Bundler {
    constructor(stats, options) {
        this.compilers = {};
        this.chunkManifest = {};
        this.bundleDefinitions = {};
        this.stats = stats;
        this.options = options;

        const chunksJson = Webiny.projectRoot('dist/cache/chunks.json');
        if (Webiny.fileExists(chunksJson)) {
            this.chunkManifest = JSON.parse(Webiny.readFile(chunksJson));
        }
    }

    bundle() {
        return new Promise(finishBundling => {
            // Generate bundles
            this.stats.stats.map(s => {
                const compiler = s.compilation.compiler;
                this.compilers[compiler.name] = {
                    resolver: compiler.resolvers.normal,
                    context: compiler.options.context,
                    outputPath: compiler.options.output.path,
                    publicPath: '/build/production/' + compiler.name.replace('.', '_')
                };
            });

            const stats = this.stats.toJson();
            // Build chunk manifest for all apps
            stats.children.map(app => {
                app.chunks.map(chunk => {
                    if (chunk.entry || !chunk.files) {
                        return;
                    }

                    const filteredModules = chunk.modules.filter(m => !m.name.includes('/node_modules/')).sort(sortByIndex);
                    if (filteredModules.length > 0) {
                        const chunkFile = this.compilers[app.name].outputPath + '/' + chunk.files[0];
                        this.chunkManifest[chunkFile] = filteredModules.map(m => Webiny.projectRoot() + _.trimStart(m.name, '.'));
                    }
                });
            });

            Webiny.info('Preparing bundles...');

            // Build bundles for each app
            const bundleModuleResolves = [];
            stats.children.map(app => {
                const compiler = this.compilers[app.name];
                this.bundleDefinitions[app.name] = {};
                const bundlesManifest = compiler.context + '/bundles.json';
                if (!Webiny.fileExists(bundlesManifest)) {
                    return;
                }

                const metaJson = compiler.outputPath + '/meta.json';
                let meta = JSON.parse(Webiny.readFile(metaJson));
                const bundles = JSON.parse(Webiny.readFile(bundlesManifest));
                _.each(bundles, (modules, url) => {
                    _.set(this.bundleDefinitions[app.name], url, modules);
                    modules.map(m => {
                        bundleModuleResolves.push(
                            new Promise(r => {
                                const moduleIndex = this.bundleDefinitions[app.name][url].indexOf(m);
                                compiler.resolver.resolve(compiler.context, '', m, (err, res) => {
                                    if (err) {
                                        Webiny.failure(chalk.red(m));
                                        return r();
                                    }

                                    // Find entry module file in the list of modules for certain chunk
                                    let chunkFile = null;
                                    _.each(this.chunkManifest, (modules, file) => {
                                        if (modules.includes(res) && Webiny.fileExists(file)) {
                                            chunkFile = file;
                                            return false;
                                        }
                                    });

                                    if (!chunkFile) {
                                        delete this.bundleDefinitions[app.name][url][moduleIndex];
                                        Webiny.failure(chalk.red('Chunk not found: ') + magenta(res));
                                        return r();
                                    }

                                    this.bundleDefinitions[app.name][url][moduleIndex] = chunkFile;
                                    r();
                                });
                            })
                        );
                    });

                });
            });

            // Resolve module paths
            Promise.all(bundleModuleResolves).then(() => this.writeBundles()).then(() => {
                finishBundling();
            }).catch(err => {
                console.log(err);
                finishBundling();
            });
        });
    }

    writeBundles() {
        _.each(this.bundleDefinitions, (bundles, appName) => {
            if (!Object.keys(bundles).length) {
                return;
            }

            Webiny.info('Writing bundles for ' + magenta(appName) + ':');
            const compiler = this.compilers[appName];
            const metaJson = compiler.outputPath + '/meta.json';
            const appMeta = JSON.parse(Webiny.readFile(metaJson));
            _.each(bundles, (chunks, url) => {
                const md5 = crypto.createHash('md5');
                const bundleContent = chunks.filter(c => !!c).map(chunk => Webiny.readFile(chunk)).join("\n");
                const bundleHash = md5.update(bundleContent).digest('hex').substr(0, 10);
                _.set(appMeta, 'bundles.' + url, this.generateUrl(compiler.publicPath + '/bundles/' + bundleHash + '.js'));
                Webiny.writeFile(compiler.outputPath + '/bundles/' + bundleHash + '.js', bundleContent);
                const size = SizeFormatHelpers.formatSize(bundleContent.length);
                Webiny.success(`${url} => ${magenta(bundleHash + '.js')} (${yellow(size)})`);
            });
            Webiny.writeFile(metaJson, JSON.stringify(appMeta, null, 4));
        });

        // Save chunk manifest
        const chunksJson = Webiny.projectRoot('dist/cache/chunks.json');
        Webiny.writeFile(chunksJson, JSON.stringify(this.chunkManifest, null, 4));
    }

    generateUrl(file) {
        let prefix = '';

        _.each(this.options.assetRules, rule => {
            const regex = new RegExp(rule.test);
            if (regex.test(file)) {
                prefix = rule.domain + prefix;
                return false;
            }
        });

        return prefix + file;
    }
}

export default  Bundler;