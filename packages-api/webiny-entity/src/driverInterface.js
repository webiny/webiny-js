// @flow
const Query = require('./entityOperation');
const Entity = require('./entity');

interface DriverInterface {

	constructor(params: {}):undefined,

	onEntityConstruct(entity: Entity): undefined,

	save(entity: Entity, params: {}): QueryResult,

	delete(entity: Entity, params: {}): Query,

	findById(entity: Entity, id: any, params: {}): Query,

	findByIds(entity: Entity, ids: Array, params: {}): Query,

	findOne(entity: Entity, params: {}): Query,

	find(entity: Entity, params: {}): Query,

	count(entity: Entity, params: {}): Query,
}

module.exports = DriverInterface;