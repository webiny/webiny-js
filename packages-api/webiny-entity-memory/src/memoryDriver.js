const {Driver, QueryResult} = require('webiny-entity');
import _ from 'lodash';
const mdbid = require('mdbid');

class MemoryDriver extends Driver {
	constructor() {
		super();
		this.data = {};
	}

	async save(entity, options) {
		// Check if table exists.
		if (!this.data[entity.classId]) {
			this.data[entity.classId] = [];
		}

		if (entity.isExisting()) {
			const storedItemIndex = _.findIndex(this.data[entity.classId], {id: entity.id});
			this.data[entity.classId][storedItemIndex] = await entity.toStorage();
			return;
		}

		entity.id = mdbid();
		this.data[entity.classId].push(await entity.toStorage());
	}

	async delete(entity, options) {
		if (!this.data[entity.classId]) {
			return;
		}

		const index = _.findIndex(this.data[entity.classId], {id: entity.id});
		if (index === -1) {
			return;
		}

		this.data[entity.classId].splice(index, 1);
	}

	async count(entity, options) {
		const results = await this.find(entity, options);
		return new QueryResult(results.getResult().length);
	}

	async findById(entity, id, options) {
		return new QueryResult(_.find(this.data[entity.classId], {id}));
	}

	async findByIds(entity, ids, options) {
		const cloned = _.cloneDeep(options);
		cloned.query = {id: ids};
		return this.find(entity, cloned);
	}

	async findOne(entity, options) {
		return new QueryResult(_.find(this.data[entity.classId], options.query));
	}

	async find(entity, options) {
		const records = this.data[entity.classId];
		if (!records) {
			return new QueryResult([]);
		}

		const query = _.get(options, 'query', {});
		if (_.isEmpty(query)) {
			return new QueryResult(this.data[entity.classId])
		}

		const collection = [];

		this.data[entity.classId].forEach(record => {
			for (const [key, value] of Object.entries(query)) {
				if (_.isArray(value)) {
					if (!value.includes(record[key])) {
						return true;
					}
				} else if (record[key] !== value) {
					return true;
				}
			}
			collection.push(record);
		});

		return new QueryResult(collection);
	}

	flush(classId) {
		if (classId) {
			_.has(this.data, classId) && delete this.data[classId];
		} else {
			this.data = {};
		}
		return this;
	}

	import(classId, data) {
		data.forEach((item, index) => {
			if (!item.id) {
				throw Error('Failed importing data - missing ID for item on index ' + index + '.');
			}
		});

		if (!this.data[classId]) {
			this.data[classId] = [];
		}

		data.forEach(importedItem => {
			const storedItemIndex = _.findIndex(this.data[classId], {id: importedItem.id});
			if (storedItemIndex === -1) {
				this.data[classId].push(importedItem);
			} else {
				this.data[classId][storedItemIndex] = importedItem;
			}
		});

		return this;
	}
}

module.exports = MemoryDriver;