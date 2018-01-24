// @flow
import _ from "lodash";
import QueryResult from "./queryResult";
import EntityModel from "./entityModel";

class Driver {
    constructor() {}

    // eslint-disable-next-line
    onEntityConstruct(entity: Entity) {}

    getModelClass(): Class<EntityModel> {
        return EntityModel;
    }

    // eslint-disable-next-line
    async save(entity: Entity, params: {}): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async delete(entity: Entity, params: {}): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async findById(entity: Entity, id: string, params: {}): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async findByIds(entity: Entity, ids: Array<string>, params: {}): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async findOne(entity: Entity, params: {}): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async find(entity: Entity, params: {}): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async count(entity: Entity, params: {}): Promise<QueryResult> {
        return new QueryResult(0);
    }

    // eslint-disable-next-line
    isId(entity: Entity, id: string, params: {}): boolean {
        return _.isString(id);
    }
}

export default Driver;
