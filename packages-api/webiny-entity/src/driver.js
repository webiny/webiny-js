const QueryResult = require('./queryResult');

class Driver {
	constructor() {
	}

	onEntityConstruct(entity) {
	}

	getModelClass() {
		const {EntityModel} = require('.');
		return EntityModel;
	}

	async save(entity, params) {
		return new QueryResult();
	}

	async delete(entity, params) {
		return new QueryResult();
	}

	async findById(entity, id, params) {
		return new QueryResult();
	}

	async findByIds(entity, ids, params) {
		return new QueryResult();
	}

	async findOne(entity, params) {
		return new QueryResult();
	}

	async find(entity, params) {
		return new QueryResult();
	}

	async count(entity, params) {
		return new QueryResult(0);
	}

	async isId(entity, params) {
		return true;
	}
}

module.exports = Driver;