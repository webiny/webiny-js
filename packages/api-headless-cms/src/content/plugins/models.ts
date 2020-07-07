import { withUser } from "@webiny/api-security";
import { pipe, withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { ContextPlugin } from "@webiny/graphql/types";
import contentModel from "./models/contentModel.model";
import cmsAccessToken from "../../plugins/models/accessToken.model";
import CmsEnvironment2AccessToken from "../../plugins/models/environment2accessToken";
import environmentModel from "../../plugins/models/environment.model";
import environmentModelAlias from "../../plugins/models/environmentAlias.model";
import contentModelGroup from "./models/contentModelGroup.model";
import contentEntrySearch from "./models/contentEntrySearch.model";
import { createDataModel } from "./utils/createDataModel";
import { createEnvironmentBase as createEnvironmentBaseFactory } from "./utils/createEnvironmentBase";
import { CmsContext, ContextBeforeContentModelsPlugin } from "@webiny/api-headless-cms/types";

export default () => {
    async function apply(context: CmsContext) {
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
            }),
            CmsEnvironment2AccessToken: CmsEnvironment2AccessToken({
                createBase,
                context
            }),
            CmsAccessToken: cmsAccessToken({ createBase, context })
        };

        // Before continuing with the rest of the models, we must load the environment and assign it to the context.
        let environment = null;
        let environmentAlias = null;

        if (context.cms.environment && typeof context.cms.environment === "string") {
            if (context.models.CmsEnvironment.isId(context.cms.environment)) {
                environment = await context.models.CmsEnvironment.findById(context.cms.environment);
            } else {
                environmentAlias = await context.models.CmsEnvironmentAlias.findOne({
                    query: { slug: context.cms.environment }
                });
                if (environmentAlias) {
                    environment = await environmentAlias.environment;
                }
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

        context.models.createEnvironmentBase = createEnvironmentBase;

        const beforeContentModelsPlugins = context.plugins.byType<ContextBeforeContentModelsPlugin>(
            "context-before-content-models"
        );

        for (let i = 0; i < beforeContentModelsPlugins.length; i++) {
            await beforeContentModelsPlugins[i].apply(context);
        }

        // Build Commodo models from CmsContentModels
        const contentModels = await context.models.CmsContentModel.find();
        const createdContentModels = {};
        for (let i = 0; i < contentModels.length; i++) {
            const contentModel = contentModels[i];
            createdContentModels[contentModel.modelId] = createDataModel(
                createEnvironmentBaseFactory({ context, addEnvironmentField: false }),
                contentModel,
                context
            );
        }

        Object.assign(context.models, createdContentModels);

        context.models.contentModels = createdContentModels;
    }

    return [
        {
            name: "context-cms-models",
            type: "context",
            apply(context) {
                return apply(context);
            }
        } as ContextPlugin<CmsContext>
    ];
};
