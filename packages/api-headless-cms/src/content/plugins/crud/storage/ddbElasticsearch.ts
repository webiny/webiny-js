import { CmsContentModelGroupCrudProvider } from "../../../../types";
import CmsContentModelGroupCrudImpl from "./contentModelGroup/ddbElasticsearch";

const contentModelGroupCrudProvider = (): CmsContentModelGroupCrudProvider => ({
    type: "cms-content-model-group-provider",
    name: "cms-content-model-group-ddb-es-crud",
    provide: async ({ context }) => {
        return new CmsContentModelGroupCrudImpl({
            context
        });
    }
});

export default () => [
    contentModelGroupCrudProvider()
    // contentModelCrudProvider(),
    // contentEntryCrudProvider(),
];
