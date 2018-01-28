// @flow
import QueryResult from "./queryResult";
import EntityModel from "./entityModel";

class Driver {
    connection: mixed;
    constructor() {
        this.connection = null;
    }

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
    async findById(entity: Entity, id: mixed, params: {}): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async findByIds(entity: Entity, ids: Array<mixed>, params: {}): Promise<QueryResult> {
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

    getConnection(): mixed {
        return this.connection;
    }

    // eslint-disable-next-line
    isId(entity: Entity, id: mixed, params: {}): boolean {
        return typeof id === "string";
    }
}

export default Driver;
