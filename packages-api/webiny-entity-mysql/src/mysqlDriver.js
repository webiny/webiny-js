const {MySQLModel} = require('./model');
const {Driver, QueryResult} = require('webiny-entity');
const queryBuilder = require('webiny-sql-query-builder');
const _ = require('lodash');

class MySQLDriver extends Driver {
	constructor(options) {
		super();
		this.connection = options.connection;
		this.model = options.model || MySQLModel;

		this.idGenerator = options.idGenerator || null;

		this.tables = _.merge({
			prefix: '',
			naming: null
		}, options.tables);
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
					table: this.getTableName(entity),
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
			const sql = queryBuilder.build({operation: 'insert', data, table: this.getTableName(entity)});
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
				table: this.getTableName(entity),
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
				table: this.getTableName(entity),
				where: options.query,
				limit: 1
			});

			this.getConnection().query(sql, (error, results) => {
				this.workingWithSingleConnection() && this.getConnection().end();
				error ? reject(error) : resolve(new QueryResult(results[0]));
			});
		});
	}

	async findById(entity, id, options) {
		return this.findOne(entity, {table: this.getTableName(entity), where: {id}});
	}

	async findByIds(entity, ids, options) {
		const cloned = _.cloneDeep(options);
		cloned.where = {id: ids};
		return this.find(entity, cloned);
	}

	async find(entity, options) {
		return new Promise(async (resolve, reject) => {
			const clonedOptions = _.merge({}, options, {table: this.getTableName(entity), operation: 'select'});
			if (_.has(clonedOptions, 'query')) {
				clonedOptions.where = clonedOptions.query;
				delete  clonedOptions.query;
			}

			const sql = queryBuilder.build(clonedOptions);

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

	async count(entity, options) {
		return new Promise(async (resolve, reject) => {
			const sql = queryBuilder.build(_.merge({}, options, {table: this.getTableName(entity), operation: 'count'}));
			this.getConnection().query(sql, (error, results) => {
				this.workingWithSingleConnection() && this.getConnection().end();
				error ? reject(error) : resolve(new QueryResult(results[0].count));
			});
		});
	}

	isId(value) {
		return _.isFunction(this.idGenerator) ? _.isString(value) : _.isNumber(value) && value > 0;
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

	setTablePrefix(tablePrefix) {
		this.tables.prefix = tablePrefix;
		return this;
	}

	getTablePrefix() {
		return this.tables.prefix;
	}

	setTableNaming(tableNameGenerator) {
		this.tables.naming = tableNameGenerator;
		return this;
	}

	getTableNaming() {
		return this.tables.naming;
	}

	getTableName(entity) {
		const isClass = typeof entity === 'function';
		const params = {
			classId: isClass ? entity.classId : entity.constructor.classId,
			tableName: isClass ? entity.tableName : entity.constructor.tableName
		};

		if (_.isFunction(this.getTableNaming())) {
			return this.getTableNaming()({entity, ...params, driver: this});
		}

		if (params.tableName) {
			return this.tables.prefix + params.tableName;
		}

		return this.tables.prefix + params.classId;
	}
}

module.exports = MySQLDriver;