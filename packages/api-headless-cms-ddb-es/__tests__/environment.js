const plugins = require("../dist/index");
const JestDynaliteEnvironment = require("jest-dynalite/environment");

class CmsTestEnvironment extends JestDynaliteEnvironment {
    esClient;

    async setup() {
        await super.setup();

        this.global.handlerPlugins = [];
        this.global.plugins = plugins;
        this.global.beforeEach = this._beforeEach;
        this.global.afterEach = this._afterEach;
        this.global.beforeAll = this._beforeAll;
        this.global.afterAll = this._afterAll;
    }

    async teardown() {
        await super.teardown();
    }

    async _beforeEach() {
        await this.clearEsIndices();
    }

    async _afterEach() {
        await this.clearEsIndices();
    }

    async _beforeAll() {
        await this.clearEsIndices();
    }

    async _afterAll() {
        await this.clearEsIndices();
    }

    async clearEsIndices() {
        await this.esClient.indices.delete({
            index: "_all"
        });
    }
}

module.exports = CmsTestEnvironment;
