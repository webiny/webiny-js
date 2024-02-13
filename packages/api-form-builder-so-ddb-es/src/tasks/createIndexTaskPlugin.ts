import { createElasticsearchIndexTaskPlugin } from "@webiny/api-elasticsearch-tasks";
import { configurations } from "~/configurations";
import { FormBuilderContext } from "~/types";

export const createIndexTaskPlugin = () => {
    return createElasticsearchIndexTaskPlugin<FormBuilderContext>({
        name: "elasticsearch.formBuilder.createIndexTaskPlugin",
        getIndexList: async params => {
            const { context, tenant, locale } = params;

            const { index } = configurations.es({
                tenant,
                locale
            });
            return [
                {
                    index,
                    settings: configurations.indexSettings({
                        context,
                        locale
                    })
                }
            ];
        }
    });
};
