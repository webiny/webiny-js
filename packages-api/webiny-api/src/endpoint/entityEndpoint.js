// @flow
import { ModelError } from "webiny-model";
import { Entity, EntityCollection } from "webiny-entity";
import Endpoint from "./endpoint";
import requestUtils from "./../etc/requestUtils";
import ApiContainer from "./apiContainer";
import ApiResponse from "./../response/apiResponse";
import ApiErrorResponse from "../response/apiErrorResponse";

class EntityEndpoint extends Endpoint {
    getEntityClass(): Class<Entity> {
        throw new Error(`"getEntityClass" method not implemented in ${this.constructor.classId}`);
    }

    /**
     * Create default CRUD methods for given entity
     * @param {ApiContainer} api
     */
    init(api: ApiContainer) {
        super.init(api);
        const classId = this.constructor.classId;
        const EntityClass = this.getEntityClass();
        const entityClassId = EntityClass.classId;

        const createNotFoundResponse = id => {
            return new ApiErrorResponse(
                { id },
                `${entityClassId} with id ${id} was not found!`,
                "WBY_ENTITY_NOT_FOUND"
            );
        };

        const createValidationErrorResponse = (e: ModelError) => {
            return new ApiErrorResponse(e.data, `${entityClassId} validation failed!`, e.code);
        };

        // CRUD List
        api.get(`List.${classId}`, "/", async ({ req }) => {
            const utils = requestUtils(req);
            const params = {
                page: utils.getPage(),
                perPage: utils.getPerPage(10),
                order: utils.getSorters(),
                query: utils.getFilters(),
                search: utils.getSearch()
            };
            const data: EntityCollection = await this.getEntityClass().find(params);
            const response = await this.formatList(data, requestUtils(req).getFields());
            return new ApiResponse(response);
        });

        // CRUD Get
        api.get(`Get.${classId}`, "/:id", async ({ req, id }) => {
            const entity = await EntityClass.findById(id);
            if (!entity) {
                return createNotFoundResponse(id);
            }
            const response = await this.formatEntity(entity, requestUtils(req).getFields());
            return new ApiResponse(response);
        });

        // CRUD Create
        api.post(`Create.${classId}`, "/", async ({ req }) => {
            const entity = new EntityClass();
            try {
                await entity.populate(req.body).save();
            } catch (e) {
                return createValidationErrorResponse(e);
            }
            const response = await this.formatEntity(entity, requestUtils(req).getFields());
            return new ApiResponse(response);
        });

        // CRUD Update
        api.patch(`Update.${classId}`, "/:id", async ({ req, id }) => {
            const entity = await EntityClass.findById(id);
            if (!entity) {
                return createNotFoundResponse(id);
            }
            try {
                await entity.populate(req.body).save();
            } catch (e) {
                return createValidationErrorResponse(e);
            }
            const response = await this.formatEntity(entity, requestUtils(req).getFields());
            return new ApiResponse(response);
        });

        // CRUD Delete
        api.delete(`Delete.${classId}`, "/:id", async ({ id }) => {
            const entity = await EntityClass.findById(id);
            if (!entity) {
                return createNotFoundResponse(id);
            }
            await entity.delete();
            return new ApiResponse(true);
        });
    }

    async formatEntity(entity: Entity, fields: string): Promise<{ entity: Object, meta: Object }> {
        const data = await entity.toJSON(fields);
        const meta = { fields };
        return { entity: data, meta };
    }

    async formatList(
        entityCollection: EntityCollection,
        fields: string
    ): Promise<{ list: Array<Object>, meta: Object }> {
        const list = await entityCollection.toJSON(fields);
        const meta = entityCollection.getParams();
        meta.totalCount = entityCollection.getMeta().totalCount;
        meta.count = entityCollection.length;
        return { list, meta };
    }
}

export default EntityEndpoint;
