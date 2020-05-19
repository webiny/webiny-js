import { withUser } from "@webiny/api-security";
import { pipe, withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { ContextPlugin } from "@webiny/graphql/types";
import { Context } from "@webiny/api-plugin-commodo-db-proxy/types";
import contentModel from "./models/contentModel.model";
import environmentModel from "../../plugins/models/environment.model";
import environmentModelAlias from "../../plugins/models/environmentAlias.model";
import contentModelGroup from "./models/contentModelGroup.model";
import contentEntrySearch from "./models/contentEntrySearch.model";
import { createDataModel } from "./utils/createDataModel";
import { createEnvironmentBase as createEnvironmentBaseFactory } from "./utils/createEnvironmentBase";

export default () => {
    async function apply(context) {
        const driver = context.commodo && context.commodo.driver;

        if (!driver) {
            throw Error(
                `Commodo driver is not configured! Make sure you add a Commodo driver plugin to your service.`
            );
        }

        const createBase = () =>
            pipe(
                withFields({
                    id: context.commodo.fields.id()
                }),
                withStorage({ driver }),
                withUser(context),
                withSoftDelete(),
                withCrudLogs()
            )() as Function;

        context.models = {
            createBase,
            CmsEnvironment: environmentModel({ createBase, context }),
            CmsEnvironmentAlias: environmentModelAlias({
                createBase,
                context
            })
        };

        // Before continuing with the rest of the models, we must load the environment and assign it to the context.
        let environment = null;
        let environmentAlias = null;
        if (context.cms.environment && typeof context.cms.environment === "string") {
            if (context.commodo.isId(context.cms.environment)) {
                environment = await context.models.CmsEnvironment.findById(context.cms.environment);
            } else {
                environmentAlias = await context.models.CmsEnvironmentAlias.findOne({
                    query: { slug: context.cms.environment }
                });
                environment = await environmentAlias.environment;
            }
        }

        if (!environment) {
            throw Error(
                "Could not load environment, please check if the passed environment alias slug or environment ID is correct."
            );
        }

        context.cms.environment = environment.slug;
        context.cms.getEnvironment = () => environment;
        context.cms.getEnvironmentAlias = () => environmentAlias;

        const createEnvironmentBase = createEnvironmentBaseFactory({
            context,
            addEnvironmentField: true
        });

        context.models.CmsContentModelGroup = contentModelGroup({
            createBase: createEnvironmentBase,
            context
        });

        context.models.CmsContentModel = contentModel({
            createBase: createEnvironmentBase,
            context
        });

        context.models.CmsContentEntrySearch = contentEntrySearch({
            createBase: createEnvironmentBase
        });

        context.createEnvironmentBase = createEnvironmentBase;

        // Build Commodo models from CmsContentModels
        const contentModels = await context.models.CmsContentModel.find();
        for (let i = 0; i < contentModels.length; i++) {
            const contentModel = contentModels[i];
            context.models[contentModel.modelId] = createDataModel(
                createEnvironmentBaseFactory({ context, addEnvironmentField: false }),
                contentModel,
                context
            );
        }
    }

    return [
        {
            name: "context-cms-models",
            type: "context",
            apply(context) {
                return apply(context);
            }
        } as ContextPlugin<Context>
    ];
};
