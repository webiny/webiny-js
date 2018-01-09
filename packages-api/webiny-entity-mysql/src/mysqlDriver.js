const {MySQLModel} = require('./model');
const {Driver, QueryResult} = require('webiny-entity');
const queryBuilder = require('webiny-sql-query-builder');
const _ = require('lodash');

class MySQLDriver extends Driver {
	constructor(options) {
		super();
		this.connection = options.connection;

		// If true, driver will automatically generate hash IDs, instead of using MySQLs auto-increment integer IDs.
		this.idGenerator = options.idGenerator || null;

		this.model = options.model || MySQLModel;
	}

	onEntityConstruct(entity) {
		if (!_.isFunction(this.idGenerator)) {
			entity.attr('id').integer().setValidators('gt:0');
		}
	}

	getModelClass() {
		return this.model;
	}

	async save(entity, options) {
		if (!entity.isExisting() && _.isFunction(this.getIdGenerator())) {
			entity.id = this.getIdGenerator()(entity, options);
		}

		if (entity.isExisting()) {
			return new Promise(async (resolve, reject) => {
				const data = await entity.toStorage();
				const sql = queryBuilder.build({
					operation: 'update',
					table: entity.classId,
					data,
					where: {id: data.id},
					limit: 1
				});

				this.getConnection().query(sql, error => {
					this.workingWithSingleConnection() && this.getConnection().end();
					error ? reject(error) : resolve();
				});
			});
		}

		return new Promise(async (resolve, reject) => {
			const data = await entity.toStorage();
			const sql = queryBuilder.build({operation: 'insert', data, table: entity.classId});
			this.getConnection().query(sql, (error, results) => {
				this.workingWithSingleConnection() && this.getConnection().end();
				if (error) {
					entity.id && entity.getAttribute('id').reset();
					return reject(error);
				}

				if (!_.isFunction(this.getIdGenerator())) {
					entity.id = results.insertId;
				}
				resolve();
			});
		});
	}

	async delete(entity, options) {
		return new Promise(async (resolve, reject) => {
			const id = await entity.getAttribute('id').getStorageValue();
			const sql = queryBuilder.build({
				operation: 'delete',
				table: entity.classId,
				where: {id},
				limit: 1
			});

			this.getConnection().query(sql, (error) => {
				this.workingWithSingleConnection() && this.getConnection().end();
				error ? reject(error) : resolve();
			});
		});
	}

	async findOne(entity, options) {
	 	return new Promise(async (resolve, reject) => {
			const sql = queryBuilder.build({
				operation: 'select',
				table: entity.classId,
				where: options.where,
				limit: 1
			});

			this.getConnection().query(sql, (error, results) => {
				this.workingWithSingleConnection() && this.getConnection().end();
				error ? reject(error) : resolve(new QueryResult(results[0]));
			});
		});
	}

	async findById(entity, id, options) {
		return this.findOne(entity, {table: entity.classId, where: {id}});
	}

	async find(entity, options) {
		return new Promise(async (resolve, reject) => {
			const sql = queryBuilder.build(_.merge({}, options, {table: entity.classId, operation: 'select'}));

			if (this.workingWithConnectionPool()) {
				this.getConnection().getConnection((error, connection) => {
					if (error) {
						reject(error);
						return;
					}

					connection.query(sql, (error, results) => {
						if (error) {
							connection.release();
							return reject(error);
						}

						connection.query("SELECT FOUND_ROWS() as count", (error, result) => {
							connection.release();
							error ? reject(error) : resolve(new QueryResult(results, {count: result[0].count}));
						});
					});
				});
			}


			this.getConnection().query(sql, (error, results) => {
				if (error) {
					this.getConnection().end();
					return reject(error);
				}

				this.getConnection().query("SELECT FOUND_ROWS() as count", (err, result) => {
					this.getConnection().end();
					error ? reject(error) : resolve(new QueryResult(results, {count: result[0].count}));
				});

			});
		});
	}

	async findIds(entity, options) {
		return new Promise(async resolve => {
			const result = await this.find(entity, _.merge(options, {columns: ['id']}));
			result.setResult(result.getResult().map(item => item.id));
			resolve(result);
		});
	}

	async count(entity, options) {
		return new Promise(async (resolve, reject) => {
			const sql = queryBuilder.build(_.merge({}, options, {table: entity.classId, operation: 'count'}));
			this.getConnection().query(sql, (error, results) => {
				this.workingWithSingleConnection() && this.getConnection().end();
				error ? reject(error) : resolve(new QueryResult(results[0].count));
			});
		});
	}

	getConnection() {
		return this.connection;
	}

	workingWithConnectionPool() {
		return _.isFunction(this.connection.getConnection);
	}

	workingWithSingleConnection() {
		return !this.workingWithConnectionPool();
	}

	setIdGenerator(idGenerator) {
		this.idGenerator = idGenerator;
		return this;
	}

	getIdGenerator() {
		return this.idGenerator;
	}
}

module.exports = MySQLDriver;