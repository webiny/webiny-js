const fsExtra = require("fs-extra");
const glob = require("glob");
const path = require("path");

class WebinyPackage {
    constructor(pkg) {
        this.pkg = pkg;
        this.path = `./packages/${this.pkg}`;
        this.srcPath = `${this.path}/src`;
        this.packageJsonPath = `${this.path}/package.json`;
        //this.tsconfigJsonPath = `${this.path}/tsconfig.json`;
        //this.tsconfigbuildJsonPath = `${this.path}/tsconfig.build.json`;
        this.name = this.getPackageName();
    }
    /**
     * @private
     */
    getPackageName() {
        const json = fsExtra.readJsonSync(this.packageJsonPath);
        if (!json.name) {
            throw new Error(`Missing package "${this.path}" package.json name.`);
        }
        return json.name;
    }

    isWebinyPackage() {
        return this.name.startsWith("@webiny/");
    }

    files() {
        if (this._files) {
            return this._files;
        }
        const paths = [`${this.srcPath}`, `${this.path}/__tests__`];
        this._files = paths.reduce((files, path) => {
            const tsFiles = glob.sync(`${path}/**/**.ts`);
            const tsxFiles = glob.sync(`${path}/**/**.tsx`);
            return files.concat(tsFiles).concat(tsxFiles);
        }, []);
        return this._files;
    }

    refactorFiles() {
        return this.files().reduce((collection, file) => {
            collection[file] = this.refactorFile(file);
            return collection;
        }, {});
    }

    refactorFile(file) {
        const initialContent = fsExtra.readFileSync(file).toString();

        const re = new RegExp(`\"${this.name}/([a-zA-Z0-9\/\.\-]+)\"`, "g");

        const matched = (initialContent.match(re) || []).map(m => {
            return m.replace(/^"/, "").replace(/"$/, "");
        });
        if (matched.length === 0) {
            return false;
        }
        let content = initialContent;
        for (const replaceWhat of matched) {
            const matchedImportPath = replaceWhat.replace(this.name, this.srcPath);
            const r = path.relative(file, `${matchedImportPath}`).replace("../", "");
            const replaceWith = r.startsWith(".") ? r : `./${r}`;
            content = content.replace(new RegExp(replaceWhat, "g"), replaceWith);
        }
        fsExtra.writeFileSync(file, content);
        return true;
    }
}

const packages = fsExtra.readdirSync("./packages").reduce((collection, pkg) => {
    const def = new WebinyPackage(pkg);
    if (!def.isWebinyPackage()) {
        return collection;
    }
    collection[pkg] = def;
    return collection;
}, {});

for (const name in packages) {
    const pkg = packages[name];
    pkg.refactorFiles();
}
