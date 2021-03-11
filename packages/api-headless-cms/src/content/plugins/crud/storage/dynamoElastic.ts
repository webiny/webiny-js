import {
    CmsContentModelGroupCrudProvider,
    CmsContentModelCrudProvider,
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

const contentModelGroupCrudProvider = (): CmsContentModelGroupCrudProvider => ({
    type: "cms-content-model-group-crud-provider",
    name: "cms-content-model-group-ddb-es-crud",
    provide: async ({ context }) => {
        const basePrimaryKey = createBasePrimaryKey(context);
        return new CmsContentModelGroupCrudDynamoElastic({
            context,
            basePrimaryKey
        });
    }
});

const contentModelCrudProvider = (): CmsContentModelCrudProvider => ({
    type: "cms-content-model-crud-provider",
    name: "cms-content-model-ddb-es-crud",
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
