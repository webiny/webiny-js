import {
    CmsContentEntryStorageOperationsProvider,
    CmsContentModelGroupStorageOperationsProvider,
    CmsContentModelStorageOperationsProvider,
    CmsContext
} from "../../../../types";
import CmsContentModelGroupCrudDynamoElastic from "./contentModelGroup/dynamoElastic";
import CmsContentModelCrudDynamoElastic from "./contentModel/dynamoElastic";
import CmsContentEntryCrudDynamoElastic from "./contentEntry/dynamoElastic";
import WebinyError from "@webiny/error";

const createBasePrimaryKey = ({ security, cms }: CmsContext): string => {
    const tenant = security.getTenant();
    if (!tenant) {
        throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
    }

    const locale = cms.getLocale();
    if (!locale) {
        throw new WebinyError("Locale missing.", "LOCALE_NOT_FOUND");
    }

    return `T#${tenant.id}#L#${locale.code}#CMS#CMG`;
};

const contentModelGroupStorageOperationsProvider = (): CmsContentModelGroupStorageOperationsProvider => ({
    type: "cms-content-model-group-storage-operations-provider",
    name: "cms-content-model-group-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        const basePrimaryKey = createBasePrimaryKey(context);
        return new CmsContentModelGroupCrudDynamoElastic({
            context,
            basePrimaryKey
        });
    }
});

const contentModelStorageOperationsProvider = (): CmsContentModelStorageOperationsProvider => ({
    type: "cms-content-model-storage-operations-provider",
    name: "cms-content-model-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        const basePrimaryKey = createBasePrimaryKey(context);
        return new CmsContentModelCrudDynamoElastic({
            context,
            basePrimaryKey
        });
    }
});

const contentEntryStorageOperationsProvider = (): CmsContentEntryStorageOperationsProvider => ({
    type: "cms-content-entry-storage-operations-provider",
    name: "cms-content-entry-storage-operations-ddb-es-crud",
    provide: async ({ context }) => {
        const basePrimaryKey = createBasePrimaryKey(context);
        return new CmsContentEntryCrudDynamoElastic({
            context,
            basePrimaryKey
        });
    }
});

export default () => [
    contentModelGroupStorageOperationsProvider(),
    contentModelStorageOperationsProvider(),
    contentEntryStorageOperationsProvider()
];
