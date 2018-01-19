const QueryResult = require('./queryResult');
import _ from 'lodash';

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

	isId(entity, id, params) {
		return _.isString(id);
	}
}

module.exports = Driver;