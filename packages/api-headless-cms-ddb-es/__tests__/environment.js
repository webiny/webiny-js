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
		await this.esClient.indices.delete({
			index: "_all"
		});
	}
	
	async _afterEach() {
		await this.esClient.indices.delete({
			index: "_all"
		});
	}
	
	async _beforeAll() {

	}
	
	async _afterAll() {

	}
}

module.exports = CmsTestEnvironment;