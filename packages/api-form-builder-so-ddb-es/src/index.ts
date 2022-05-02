import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";
import formElasticsearchFields from "./operations/form/elasticsearchFields";
import submissionElasticsearchFields from "./operations/submission/elasticsearchFields";
import WebinyError from "@webiny/error";
import { FormBuilderStorageOperationsFactory, ENTITIES } from "~/types";
import { createTable } from "~/definitions/table";
import { createFormEntity } from "~/definitions/form";
import { createSubmissionEntity } from "~/definitions/submission";
import { createSystemEntity } from "~/definitions/system";
import { createSettingsEntity } from "~/definitions/settings";
import { createSystemStorageOperations } from "~/operations/system";
import { createSubmissionStorageOperations } from "~/operations/submission";
import { createSettingsStorageOperations } from "~/operations/settings";
import { createFormStorageOperations } from "~/operations/form";
import { createElasticsearchTable } from "~/definitions/tableElasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { createElasticsearchEntity } from "~/definitions/elasticsearch";
import { getElasticsearchOperators } from "@webiny/api-elasticsearch/operators";
import { elasticsearchIndexPlugins } from "~/elasticsearch/indices";
import { createElasticsearchIndex } from "~/elasticsearch/createElasticsearchIndex";

const reservedFields = ["PK", "SK", "index", "data", "TYPE", "__type", "GSI1_PK", "GSI1_SK"];

const isReserved = (name: string): void => {
    if (reservedFields.includes(name) === false) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export const createFormBuilderStorageOperations: FormBuilderStorageOperationsFactory = params => {
    const {
        attributes,
        table: tableName,
        esTable: esTableName,
        documentClient,
        elasticsearch,
        plugins: userPlugins
    } = params;

    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const plugins = new PluginsContainer([
        /**
         * User defined plugins.
         */
        userPlugins || [],
        /**
         * Elasticsearch field definitions for the submission record.
         */
        submissionElasticsearchFields(),
        /**
         * Elasticsearch field definitions for the form record.
         */
        formElasticsearchFields(),
        /**
         * DynamoDB filter plugins for the where conditions.
         */
        dynamoDbValueFilters(),
        /**
         * Elasticsearch operators.
         */
        getElasticsearchOperators(),
        /**
         * Built-in Elasticsearch index plugins
         */
        elasticsearchIndexPlugins()
    ]);

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
        form: createFormEntity({
            entityName: ENTITIES.FORM,
            table,
            attributes: attributes ? attributes[ENTITIES.FORM] : {}
        }),
        submission: createSubmissionEntity({
            entityName: ENTITIES.SUBMISSION,
            table,
            attributes: attributes ? attributes[ENTITIES.SUBMISSION] : {}
        }),
        system: createSystemEntity({
            entityName: ENTITIES.SYSTEM,
            table,
            attributes: attributes ? attributes[ENTITIES.SYSTEM] : {}
        }),
        settings: createSettingsEntity({
            entityName: ENTITIES.SETTINGS,
            table,
            attributes: attributes ? attributes[ENTITIES.SETTINGS] : {}
        }),
        /**
         * Elasticsearch entities.
         */
        esForm: createElasticsearchEntity({
            entityName: ENTITIES.ES_FORM,
            table: esTable,
            attributes: attributes ? attributes[ENTITIES.ES_FORM] : {}
        }),
        esSubmission: createElasticsearchEntity({
            entityName: ENTITIES.ES_SUBMISSION,
            table: esTable,
            attributes: attributes ? attributes[ENTITIES.ES_SUBMISSION] : {}
        })
    };

    return {
        init: async context => {
            context.i18n.locales.onBeforeCreate.subscribe(async ({ locale, tenant }) => {
                await createElasticsearchIndex({
                    elasticsearch,
                    plugins,
                    tenant,
                    locale: locale.code
                });
            });
        },
        upgrade: null,
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
            esEntity: entities.esForm,
            plugins
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
