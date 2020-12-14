import { Context, ContextPlugin } from "@webiny/handler/types";
import { TypeValueEmitter } from "@webiny/api-headless-cms/content/plugins/utils/TypeValueEmitter";
import {
    CmsContext,
    CmsEnvironmentAliasType,
    CmsEnvironmentType
} from "@webiny/api-headless-cms/types";

export type CmsHttpParametersType = {
    type: string;
    environment: string;
    locale: string;
};

type EnvironmentAndAliasResponseType = {
    environment: CmsEnvironmentType;
    environmentAlias?: CmsEnvironmentAliasType;
};

const throwPlainError = (type: string): void => {
    throw new Error(`Missing context.http.path.parameter "${type}".`);
};

const throwRegexError = (type: string, regex: string): void => {
    throw new Error(`Parameter part "${type}" does not match a "${regex}" regex.`);
};

export const extractHandlerHttpParameters = (context: Context): CmsHttpParametersType => {
    const { key = "" } = context.http.path.parameters || {};
    const [type, environment, locale] = key.split("/");
    if (!type) {
        throwPlainError("type");
    } else if (!environment) {
        throwPlainError("environment");
    } else if (environment.match(/^([a-zA-Z0-9\-]+)$/) === null) {
        throwRegexError("environment", "^([a-zA-Z0-9\\-]+)$");
    } else if (!locale) {
        throwPlainError("locale");
    } else if (locale.match(/^([a-zA-Z]{2})-([a-zA-Z]{2})$/) === null) {
        throwRegexError("locale", "^([a-zA-Z]{2})-([a-zA-Z]{2})$");
    }

    return {
        type,
        environment,
        locale
    };
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
    // TODO verify that this is correct
    // it is getting the default locale if one sent in as argument does not exist
    // possibly it is incorrect result for our use case
    const locale = await context.i18n.getCurrentLocale(context.cms.locale);
    // need to attach environment and environment alias getters to the context for later use
    // and attach real environment slug to the context
    context.cms.environment = environment.slug;
    context.cms.getEnvironment = () => environment;
    context.cms.getEnvironmentAlias = () => environmentAlias;
    context.cms.getLocale = () => locale;
};

export default (options: any = {}): ContextPlugin<CmsContext> => ({
    type: "context",
    apply: async context => {
        const { type, environment, locale } = extractHandlerHttpParameters(context);

        context.cms = {
            ...(context.cms || ({} as any)),
            type,
            environment,
            locale,
            dataManagerFunction: options.dataManagerFunction,
            READ: type === "read",
            PREVIEW: type === "preview",
            MANAGE: type === "manage"
        };

        if (!context.cms.MANAGE) {
            context.resolvedValues = new TypeValueEmitter();
        }
        await setContextCmsVariables(context);
    }
});
