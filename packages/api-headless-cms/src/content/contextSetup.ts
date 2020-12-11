import { ContextPlugin } from "@webiny/handler/types";
import { TypeValueEmitter } from "@webiny/api-headless-cms/content/plugins/utils/TypeValueEmitter";
import { extractHandlerHttpParameters } from "@webiny/api-headless-cms/content/helpers";
import {
    CmsContext,
    CmsEnvironmentAliasType,
    CmsEnvironmentType
} from "@webiny/api-headless-cms/types";

type EnvironmentAndAliasResponseType = {
    environment: CmsEnvironmentType;
    environmentAlias?: CmsEnvironmentAliasType;
};

const filterEnvironment = (list: CmsEnvironmentType[], id: string): CmsEnvironmentType => {
    const environment = list.find(env => env.id === id);
    if (!environment) {
        throw new Error(`There is no environment "${id}".`);
    }
    return environment;
};

const fetchEnvironments = async (context: CmsContext): Promise<EnvironmentAndAliasResponseType> => {
    const environmentList = await context.cms.environments.list();
    const environmentAliasList = await context.cms.environmentAliases.list();

    const value = context.cms.environment;
    if (!value || typeof context.cms.environment !== "string") {
        throw new Error(
            `It seems that "context.cms.environment" is not a string with which we can identify the environment or alias.`
        );
    }
    // alias is always checked by slug
    const environmentAlias = environmentAliasList.find(model => {
        return model.slug === value;
    });
    if (environmentAlias) {
        const environment = filterEnvironment(environmentList, environmentAlias.environment.id);
        return {
            environmentAlias,
            environment
        };
    }
    // environment is always checked by id
    const environment = environmentList.find(model => {
        return model.id === value;
    });
    if (!environment) {
        throw new Error(`There is no environment or environment alias "${value}".`);
    }
    return {
        environment,
        environmentAlias: environmentAliasList.find(
            alias => alias.environment.id === environment.id
        )
    };
};

const setContextCmsVariables = async (context: CmsContext): Promise<void> => {
    const { environment, environmentAlias } = await fetchEnvironments(context);
    const locale = await context.i18n.getCurrentLocale(context.cms.locale);
    // need to attach environment and environment alias getters to the context for later use
    // and attach real environment slug to the context
    context.cms.environment = environment.slug;
    context.cms.getEnvironment = () => environment;
    context.cms.getEnvironmentAlias = () => environmentAlias;
    context.cms.getLocale = () => locale;
};

export default (options: any = {}): ContextPlugin => ({
    name: "context-setup",
    type: "context",
    // type CmsContext is required so we know what we can set on the context.cms
    apply: async (context: CmsContext) => {
        const { type, environment, locale } = extractHandlerHttpParameters(context);
        context.cms = context.cms || ({} as any);
        context.cms.type = type;
        context.cms.environment = environment;
        context.cms.locale = locale;
        context.cms.dataManagerFunction = options.dataManagerFunction;

        context.cms.READ = options.type === "read";
        context.cms.PREVIEW = options.type === "preview";
        context.cms.MANAGE = options.type === "manage";

        if (!context.cms.MANAGE) {
            context.resolvedValues = new TypeValueEmitter();
        }
        await setContextCmsVariables(context);
    }
});
