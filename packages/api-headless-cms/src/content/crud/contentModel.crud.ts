import { ContextPlugin } from "@webiny/handler/types";
import {
    CmsContext,
    CmsContentModelType,
    CmsContentModelContextType
} from "@webiny/api-headless-cms/types";
import defaults from "@webiny/api-headless-cms/common/defaults";
import { ContentModelManager } from "@webiny/api-headless-cms/content/crud/ContentModelManager";

// eslint-disable-next-line
const createContentModelPk = (context: any) => {
    return "contentModel#pk";
};

export default {
    type: "context",
    name: "context-content-model-crud",
    apply(context) {
        const { db } = context;

        const models: CmsContentModelContextType = {
            async get(id) {
                const [response] = await db.read<CmsContentModelType>({
                    ...defaults.db,
                    query: { PK: createContentModelPk(context), SK: id },
                    limit: 1
                });
                if (!response || response.length === 0) {
                    return null;
                }
                return response.find(() => true);
            },
            async list() {
                const [response] = await db.read<CmsContentModelType>({
                    ...defaults.db,
                    query: { PK: createContentModelPk(context), SK: { $gt: " " } }
                });
                return response;
            },
            async create() {
                return {} as any;
            },
            async update() {
                return {} as any;
            },
            async delete() {
                return;
            },
            async getManager<T>(code) {
                const models = await context.cms.models.list();
                const model = models.find(m => m.code === code);
                if (!model) {
                    throw new Error(`There is no content model "${code}".`);
                }
                return new ContentModelManager<T>(context, model);
            }
        };

        context.cms = {
            ...(context.cms || ({} as any)),
            models
        };
    }
} as ContextPlugin<CmsContext>;
