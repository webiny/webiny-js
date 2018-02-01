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
    async save(entity: Entity, params: EntitySaveParams & {}): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async delete(entity: Entity, params: EntityDeleteParams & {}): Promise<QueryResult> {
        return new QueryResult();
    }

    async findOne(
        entity: Entity | Class<Entity>,
        params: EntityFindOneParams & {} // eslint-disable-line
    ): Promise<QueryResult> {
        return new QueryResult();
    }

    async find(
        entity: Entity | Class<Entity>,
        params: EntityFindParams & {} // eslint-disable-line
    ): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async count(entity: Entity, params: EntityFindParams & {}): Promise<QueryResult> {
        return new QueryResult(0);
    }

    getConnection(): mixed {
        return this.connection;
    }

    // eslint-disable-next-line
    isId(entity: Entity, id: mixed, params: ?Object): boolean {
        return typeof id === "string";
    }
}

export default Driver;
