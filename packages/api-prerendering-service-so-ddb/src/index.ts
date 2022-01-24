import WebinyError from "@webiny/error";
import { ENTITIES, PrerenderingServiceFactory, PrerenderingServiceFactoryParams } from "~/types";
import { createTable } from "~/definitions/table";
import { createRenderEntity } from "~/definitions/render";
import { createQueueJobEntity } from "~/definitions/queueJob";
import { createRenderStorageOperations } from "~/operations/render";
import { createQueueJobStorageOperations } from "~/operations/queueJob";
import { createTagUrlLinkEntity } from "~/definitions/tagUrlLink";

const reservedFields = ["PK", "SK", "index", "data", "TYPE", "__type", "GSI1_PK", "GSI1_SK"];

const isReserved = (name: string): void => {
    if (reservedFields.includes(name) === false) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export const createPrerenderingServiceStorageOperations: PrerenderingServiceFactory = (
    params: PrerenderingServiceFactoryParams
) => {
    const { attributes, table, documentClient } = params;

    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const tableInstance = createTable({ table, documentClient });

    const entities = {
        render: createRenderEntity({
            entityName: ENTITIES.RENDER,
            table: tableInstance,
            attributes: attributes[ENTITIES.RENDER] || {}
        }),
        queueJob: createQueueJobEntity({
            entityName: ENTITIES.QUEUE_JOB,
            table: tableInstance,
            attributes: attributes[ENTITIES.QUEUE_JOB] || {}
        }),
        tagUrlLink: createTagUrlLinkEntity({
            entityName: ENTITIES.TAG_URL_LINK,
            table: tableInstance,
            attributes: attributes[ENTITIES.TAG_URL_LINK] || {}
        })
    };

    return {
        getTable: () => tableInstance,
        getEntities: () => entities,
        ...createRenderStorageOperations({
            entity: entities.render,
            tagUrlLinkEntity: entities.tagUrlLink
        }),
        ...createQueueJobStorageOperations({
            entity: entities.queueJob
        })
    };
};
