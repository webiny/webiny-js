// @flow
import QueryResult from "./queryResult";
import EntityModel from "./entityModel";
import type Entity from "./entity";
import type {
    EntitySaveParams,
    EntityFindParams,
    EntityDeleteParams,
    EntityFindOneParams
} from "../types";

class Driver {
    connection: any;

    constructor() {
        this.connection = null;
    }

    // eslint-disable-next-line
    onEntityConstruct(entity: $Subtype<Entity>) {}

    getModelClass(): Class<EntityModel> {
        return EntityModel;
    }

    // eslint-disable-next-line
    async save(entity: $Subtype<Entity>, params: EntitySaveParams & {}): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async delete(entity: $Subtype<Entity>, params: EntityDeleteParams & {}): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async findOne(
        entity: $Subtype<Entity> | Class<$Subtype<Entity>>,
        params: EntityFindOneParams & {} // eslint-disable-line
    ): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async find(
        entity: $Subtype<Entity> | Class<$Subtype<Entity>>,
        params: EntityFindParams & {} // eslint-disable-line
    ): Promise<QueryResult> {
        return new QueryResult();
    }

    // eslint-disable-next-line
    async count(
        entity: $Subtype<Entity> | Class<$Subtype<Entity>>,
        params: EntityFindParams & {} // eslint-disable-line
    ): Promise<QueryResult> {
        return new QueryResult(0);
    }

    getConnection(): mixed {
        return this.connection;
    }

    // eslint-disable-next-line
    isId(entity: $Subtype<Entity> | Class<$Subtype<Entity>>, id: mixed, params: ?Object): boolean {
        return typeof id === "string";
    }

    test() {
        return true;
    }
}

export default Driver;
