// @flow
import { Driver, QueryResult } from "webiny-entity";
import _ from "lodash";
import mdbid from "mdbid";
import { Entity } from "webiny-entity";

/**
 * MemoryDriver is an implementation of in-memory entity driver.
 * Its main purpose is to run tests without the need to mock the driver.
 * Using this class you get the exact behavior of the entity storage as if using a real database, except it only exists as long as the process is running.
 */
class MemoryDriver extends Driver {
    data: Object;

    constructor() {
        super();
        this.data = {};
    }

    // eslint-disable-next-line
    async save(entity: Entity, params: EntitySaveParams & {}): Promise<QueryResult> {
        // Check if table exists.
        if (!this.data[entity.classId]) {
            this.data[entity.classId] = [];
        }

        if (entity.isExisting()) {
            const storedItemIndex = _.findIndex(this.data[entity.classId], { id: entity.id });
            this.data[entity.classId][storedItemIndex] = await entity.toStorage();
            return new QueryResult(true);
        }

        entity.id = mdbid();
        this.data[entity.classId].push(await entity.toStorage());
        return new QueryResult(true);
    }

    // eslint-disable-next-line
    async delete(entity: Entity, params: EntityDeleteParams & {}): Promise<QueryResult> {
        if (!this.data[entity.classId]) {
            return new QueryResult(true);
        }

        const index = _.findIndex(this.data[entity.classId], { id: entity.id });
        if (index > -1) {
            this.data[entity.classId].splice(index, 1);
        }
        return new QueryResult(true);
    }

    // eslint-disable-next-line
    async count(entity: Entity, params: EntityFindParams): Promise<QueryResult> {
        const results = await this.find(entity, params);
        return new QueryResult(results.getResult().length);
    }

    async findOne(entity: Entity, params: EntityFindOneParams & {}): Promise<QueryResult> {
        return new QueryResult(_.find(this.data[entity.classId], params.query));
    }

    // eslint-disable-next-line
    async find(entity: Entity, params: EntityFindParams & Object): Promise<QueryResult> {
        const records = this.data[entity.classId];
        if (!records) {
            return new QueryResult([]);
        }

        const query = _.get(params, "query", {});
        if (_.isEmpty(query)) {
            return new QueryResult(this.data[entity.classId]);
        }

        const collection = [];

        this.data[entity.classId].forEach(record => {
            for (const [key, value] of Object.entries(query)) {
                if (value instanceof Array) {
                    if (!value.includes(record[key])) {
                        return true;
                    }
                } else if (record[key] !== value) {
                    return true;
                }
            }
            collection.push(record);
        });

        return new QueryResult(collection, { count: collection.length });
    }

    flush(classId: ?string) {
        if (classId) {
            _.has(this.data, classId) && delete this.data[classId];
        } else {
            this.data = {};
        }
        return this;
    }

    import(classId: string, data: Object) {
        data.forEach((item, index) => {
            if (!item.id) {
                throw Error("Failed importing data - missing ID for item on index " + index + ".");
            }
        });

        if (!this.data[classId]) {
            this.data[classId] = [];
        }

        data.forEach(importedItem => {
            const storedItemIndex = _.findIndex(this.data[classId], { id: importedItem.id });
            if (storedItemIndex === -1) {
                this.data[classId].push(importedItem);
            } else {
                this.data[classId][storedItemIndex] = importedItem;
            }
        });

        return this;
    }
}

export default MemoryDriver;
