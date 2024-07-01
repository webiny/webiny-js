const fs = require("fs");
const path = require("path");

class LocalFile {
    constructor(filePath) {
        this.filePath = filePath;
    }

    exists() {
        return fs.existsSync(this.filePath);
    }

    getAbsolutePath() {
        return this.filePath;
    }
}

class WebinyConfigFile {
    constructor(root) {
        this.potentialConfigs = [
            new LocalFile(path.join(root, "webiny.config.ts")),
            new LocalFile(path.join(root, "webiny.config.js"))
        ];
    }

    static forWorkspace(workspace) {
        return new WebinyConfigFile(path.resolve(workspace));
    }

    getAbsolutePath() {
        const file = this.potentialConfigs.find(file => file.exists());
        if (!file) {
            return undefined;
        }

        return file.getAbsolutePath();
    }
}

module.exports = { WebinyConfigFile };
