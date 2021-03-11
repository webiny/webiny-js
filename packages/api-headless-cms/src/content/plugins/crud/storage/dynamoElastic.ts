import {
    CmsContentModelGroupStorageOperationsProvider,
    CmsContentModelStorageOperationsProvider,
    CmsContext
} from "../../../../types";
import CmsContentModelGroupCrudDynamoElastic from "./contentModelGroup/dynamoElastic";
import CmsContentModelCrudDynamoElastic from "./contentModel/dynamoElastic";
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

const contentModelGroupCrudProvider = (): CmsContentModelGroupStorageOperationsProvider => ({
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

const contentModelCrudProvider = (): CmsContentModelStorageOperationsProvider => ({
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

export default () => [
    contentModelGroupCrudProvider(),
    contentModelCrudProvider()
    // contentEntryCrudProvider(),
];
