import { flow } from "lodash";
import { withUser } from "@webiny/api-security";
import { withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { GraphQLContextPlugin } from "@webiny/api/types";
import { CmsGraphQLContext } from "@webiny/api-headless-cms/types";
import contentModel from "./models/contentModel.model";
import { createDataModelFromData } from "./utils/createDataModelFromData";
import { createSearchModelFromData } from "./utils/createSearchModelFromData";

export default () => {
    return [
        {
            name: "graphql-context-cms-models",
            type: "graphql-context",
            async apply(context) {
                const driver = context.commodo && context.commodo.driver;

                if (!driver) {
                    throw Error(
                        `Commodo driver is not configured! Make sure you add a Commodo driver plugin to your service.`
                    );
                }

                const createBase = () =>
                    flow(
                        withFields({
                            id: context.commodo.fields.id()
                        }),
                        withStorage({ driver }),
                        withUser(context),
                        withSoftDelete(),
                        withCrudLogs()
                    )() as Function;

                // TODO: create CmsEnvironment model and load the appropriate environment
                // Then, create other models

                context.models = {
                    CmsContentModel: contentModel({ createBase, context }),
                    createBase
                };

                // Build Commodo models from CmsContentModels
                const contentModels = await context.models.CmsContentModel.find();
                for (let i = 0; i < contentModels.length; i++) {
                    const data = contentModels[i];
                    context.models[data.modelId] = createDataModelFromData(
                        createBase(),
                        data,
                        context
                    );
                    context.models[data.modelId + "Search"] = createSearchModelFromData(
                        createBase(),
                        data,
                        context
                    );
                }
            }
        } as GraphQLContextPlugin<CmsGraphQLContext>
    ];
};
