import { withUser } from "@webiny/api-security";
import {
    pipe,
    withStorage,
    withCrudLogs,
    withSoftDelete,
    withFields,
    withStaticProps,
    setOnce,
    withHooks
} from "@webiny/commodo";
import { GraphQLContextPlugin } from "@webiny/graphql/types";
import { GraphQLContext } from "@webiny/api-plugin-commodo-db-proxy/types";
import contentModel from "./models/contentModel.model";
import environmentModel from "@webiny/api-headless-cms/plugins/models/environment.model";
import environmentModelAlias from "@webiny/api-headless-cms/plugins/models/environmentAlias.model";
import contentModelGroup from "./models/contentModelGroup.model";
import { createDataModelFromData } from "./utils/createDataModelFromData";
import { createSearchModelFromData } from "./utils/createSearchModelFromData";
import cloneDeep from "lodash.clonedeep";

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

        context.models = {};
        context.models.CmsEnvironment = environmentModel({ createBase, context });
        context.models.CmsEnvironmentAlias = environmentModelAlias({
            createBase,
            context
        });

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

        const modifyQueryArgs = (args = {}) => {
            const returnArgs = cloneDeep(args);
            if (returnArgs.query) {
                returnArgs.query = {
                    $and: [{ environment: environment.id }, returnArgs.query]
                };
            } else {
                returnArgs.query = { environment: environment.id };
            }

            return returnArgs;
        };

        const createEnvironmentBase = () =>
            pipe(
                withStaticProps(({ find, count, findOne }) => ({
                    find(args) {
                        return find.call(this, modifyQueryArgs(args));
                    },
                    count(args) {
                        return count.call(this, modifyQueryArgs(args));
                    },
                    findOne(args) {
                        return findOne.call(this, modifyQueryArgs(args));
                    }
                })),
                withFields({
                    environment: setOnce()(context.commodo.fields.id())
                }),
                withHooks({
                    beforeCreate() {
                        this.environment = environment.id;
                    }
                })
            )(createBase());

        context.models.CmsContentModelGroup = contentModelGroup({
            createBase: createEnvironmentBase,
            context
        });

        context.models.CmsContentModel = contentModel({
            createBase: createEnvironmentBase,
            context
        });

        context.createBase = createBase;
        context.createEnvironmentBase = createEnvironmentBase;

        // Build Commodo models from CmsContentModels
        const contentModels = await context.models.CmsContentModel.find();
        for (let i = 0; i < contentModels.length; i++) {
            const data = contentModels[i];
            context.models[data.modelId] = createDataModelFromData(createBase(), data, context);
            context.models[data.modelId + "Search"] = createSearchModelFromData(
                createEnvironmentBase(),
                data,
                context
            );
        }
    }

    return [
        {
            name: "graphql-context-cms-models",
            type: "graphql-context",
            apply(context) {
                return apply(context);
            }
        } as GraphQLContextPlugin<GraphQLContext>
    ];
};
