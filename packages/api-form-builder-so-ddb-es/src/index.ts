import { CreateStorageOperationsFactory, ENTITIES } from "~/types";
import WebinyError from "@webiny/error";
import { createTable } from "~/definitions/table";
import { createFormEntity } from "~/definitions/form";
import { createSubmissionEntity } from "~/definitions/submission";
import { createSystemEntity } from "~/definitions/system";
import { createSettingsEntity } from "~/definitions/settings";
import { createSystemStorageOperations } from "~/operations/system";
import { createSubmissionStorageOperations } from "~/operations/submission";
import { createSettingsStorageOperations } from "~/operations/settings";
import { createFormStorageOperations } from "~/operations/form";
import { createElasticsearchIndex } from "~/operations/system/createElasticsearchIndex";
import { createElasticsearchTable } from "~/definitions/tableElasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { createElasticsearchEntity } from "~/definitions/elasticsearch";
import submissionElasticsearchFields from "./operations/submission/elasticsearchFields";

const reservedFields = ["PK", "SK", "index", "data"];

const isReserved = (name: string): void => {
    if (reservedFields.includes(name) === false) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export const createStorageOperationsFactory: CreateStorageOperationsFactory = params => {
    const {
        attributes,
        table: tableName,
        esTable: esTableName,
        documentClient,
        elasticsearch,
        plugins: pluginsInput
    } = params;

    const plugins = new PluginsContainer();

    plugins.register(pluginsInput || []);

    plugins.register(submissionElasticsearchFields());

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
        form: createFormEntity({
            entityName: ENTITIES.FORM,
            table,
            attributes: attributes[ENTITIES.FORM]
        }),
        esForm: createElasticsearchEntity({
            entityName: ENTITIES.ES_FORM,
            table,
            attributes: attributes[ENTITIES.ES_FORM]
        }),
        submission: createSubmissionEntity({
            entityName: ENTITIES.SUBMISSION,
            table,
            attributes: attributes[ENTITIES.SUBMISSION]
        }),
        esSubmission: createElasticsearchEntity({
            entityName: ENTITIES.ES_SUBMISSION,
            table,
            attributes: attributes[ENTITIES.ES_SUBMISSION]
        }),
        system: createSystemEntity({
            entityName: ENTITIES.SYSTEM,
            table,
            attributes: attributes[ENTITIES.SYSTEM]
        }),
        settings: createSettingsEntity({
            entityName: ENTITIES.SETTINGS,
            table,
            attributes: attributes[ENTITIES.SETTINGS]
        })
    };

    return {
        init: async formBuilder => {
            formBuilder.onAfterInstall.subscribe(async ({ tenant }) => {
                await createElasticsearchIndex({
                    elasticsearch,
                    tenant
                });
            });
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
        ...createFormStorageOperations({
            elasticsearch,
            table,
            entity: entities.form,
            esEntity: entities.esForm
        }),
        ...createSubmissionStorageOperations({
            elasticsearch,
            table,
            entity: entities.submission,
            esEntity: entities.esSubmission,
            plugins
        })
    };
};
