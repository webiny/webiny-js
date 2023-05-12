import WebinyError from "@webiny/error";
import { ENTITIES, PrerenderingServiceFactory, PrerenderingServiceFactoryParams } from "~/types";
import { createTable } from "~/definitions/table";
import { createRenderEntity } from "~/definitions/render";
import { createSettingsEntity } from "~/definitions/settings";
import { createQueueJobEntity } from "~/definitions/queueJob";
import { createRenderStorageOperations } from "~/operations/render";
import { createTenantStorageOperations } from "~/operations/tenant";
import { createSettingsStorageOperations } from "~/operations/settings";
import { createQueueJobStorageOperations } from "~/operations/queueJob";
import { createTagPathLinkEntity } from "~/definitions/tagPathLink";
import { createTenantEntity } from "~/definitions/tenantEntity";

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
            attributes: attributes ? attributes[ENTITIES.RENDER] : {}
        }),
        settings: createSettingsEntity({
            entityName: ENTITIES.SETTINGS,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.SETTINGS] : {}
        }),
        queueJob: createQueueJobEntity({
            entityName: ENTITIES.QUEUE_JOB,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.QUEUE_JOB] : {}
        }),
        tagPathLink: createTagPathLinkEntity({
            entityName: ENTITIES.TAG_PATH_LINK,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.TAG_PATH_LINK] : {}
        }),
        tenant: createTenantEntity({
            entityName: ENTITIES.TENANT,
            table: tableInstance
        })
    };

    return {
        getTable: () => tableInstance,
        getEntities: () => entities,
        ...createRenderStorageOperations({
            entity: entities.render,
            tagPathLinkEntity: entities.tagPathLink
        }),
        ...createQueueJobStorageOperations({
            entity: entities.queueJob
        }),
        ...createSettingsStorageOperations({
            entity: entities.settings
        }),
        ...createTenantStorageOperations({
            entity: entities.tenant
        })
    };
};
