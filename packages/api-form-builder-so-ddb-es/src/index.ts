import WebinyError from "@webiny/error";
import { FormBuilderStorageOperationsFactory, ENTITIES, FormBuilderContext } from "~/types";
import { createTable } from "~/definitions/table";
import { createSystemEntity } from "~/definitions/system";
import { createSettingsEntity } from "~/definitions/settings";
import { createSystemStorageOperations } from "~/operations/system";
import { createSubmissionStorageOperations } from "~/operations/submission";
import { createSettingsStorageOperations } from "~/operations/settings";
import { createFormStorageOperations } from "~/operations/form";
import { createFormStatsStorageOperations } from "~/operations/formStats";
import { createElasticsearchTable } from "~/definitions/tableElasticsearch";
import { createIndexTaskPlugin } from "~/tasks/createIndexTaskPlugin";
import { elasticsearchIndexPlugins } from "~/elasticsearch/indices";

const reservedFields = ["PK", "SK", "index", "data", "TYPE", "__type", "GSI1_PK", "GSI1_SK"];

const isReserved = (name: string): void => {
    if (reservedFields.includes(name) === false) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export * from "./plugins";

export const createFormBuilderStorageOperations: FormBuilderStorageOperationsFactory = params => {
    const { attributes, table: tableName, esTable: esTableName, documentClient } = params;

    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const table = createTable({
        tableName,
        documentClient
    });

    const esTable = createElasticsearchTable({
        tableName: esTableName,
        documentClient
    });

    const entities = {
        /**
         * Regular entities.
         */
        system: createSystemEntity({
            entityName: ENTITIES.SYSTEM,
            table,
            attributes: attributes ? attributes[ENTITIES.SYSTEM] : {}
        }),
        settings: createSettingsEntity({
            entityName: ENTITIES.SETTINGS,
            table,
            attributes: attributes ? attributes[ENTITIES.SETTINGS] : {}
        })
    };

    return {
        beforeInit: async (context: FormBuilderContext) => {
            context.plugins.register([createIndexTaskPlugin(), elasticsearchIndexPlugins()]);
        },
        getTable: () => table,
        getEsTable: () => esTable,
        getEntities: () => entities,
        ...createSystemStorageOperations({
            table,
            entity: entities.system
        }),
        ...createSettingsStorageOperations({
            table,
            entity: entities.settings
        }),
        forms: createFormStorageOperations(),
        formStats: createFormStatsStorageOperations(),
        submissions: createSubmissionStorageOperations()
    };
};
