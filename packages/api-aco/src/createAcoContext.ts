import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { createAcoHooks } from "~/createAcoHooks";
import { createAcoStorageOperations } from "~/createAcoStorageOperations";
import { isInstallationPending } from "~/utils/isInstallationPending";
import { AcoContext, CreateAcoParams, IAcoAppRegisterParams } from "~/types";
import { createFolderCrudMethods } from "~/folder/folder.crud";
import { createSearchRecordCrudMethods } from "~/record/record.crud";
import { AcoApps } from "./apps";
import { SEARCH_RECORD_MODEL_ID } from "~/record/record.model";
import { AcoCreateAppPlugin } from "~/plugins";

const setupAcoContext = async (context: AcoContext): Promise<void> => {
    const { tenancy, security, i18n } = context;

    if (isInstallationPending({ tenancy, i18n })) {
        return;
    }

    const getLocale = (): I18NLocale => {
        const locale = i18n.getContentLocale();
        if (!locale) {
            throw new WebinyError(
                "Missing content locale in api-aco/plugins/context.ts",
                "LOCALE_ERROR"
            );
        }

        return locale;
    };

    const getTenant = (): Tenant => {
        return tenancy.getCurrentTenant();
    };

    const getIdentity = () => security.getIdentity();

    const params: CreateAcoParams = {
        getLocale,
        getIdentity,
        getTenant,
        storageOperations: createAcoStorageOperations({
            /**
             * TODO: We need to figure out a way to pass "cms" from outside (e.g. apps/api/graphql)
             */
            cms: context.cms,
            /**
             * TODO: This is required for "entryFieldFromStorageTransform" which access plugins from context.
             */
            getCmsContext: () => context,
            security
        })
    };

    const defaultRecordModel = await context.cms.getModel(SEARCH_RECORD_MODEL_ID);
    if (!defaultRecordModel) {
        throw new WebinyError(`There is no default record model in ${SEARCH_RECORD_MODEL_ID}`);
    }

    /**
     * First we need to create all the apps.
     */
    const apps = new AcoApps(context, params);
    const plugins = context.plugins.byType<AcoCreateAppPlugin>(AcoCreateAppPlugin.type);
    for (const plugin of plugins) {
        await apps.register({
            model: defaultRecordModel,
            ...plugin.app
        });
    }

    context.aco = {
        folder: createFolderCrudMethods(params),
        search: createSearchRecordCrudMethods(params),
        apps,
        getApp: (name: string) => apps.get(name),
        listApps: () => apps.list(),
        registerApp: async (params: IAcoAppRegisterParams) => {
            return apps.register({
                model: defaultRecordModel,
                ...params
            });
        }
    };
};

export const createAcoContext = () => {
    return new ContextPlugin<AcoContext>(async context => {
        if (isInstallationPending(context)) {
            return;
        }

        await context.benchmark.measure("aco.context.setup", async () => {
            await setupAcoContext(context);
        });
        await context.benchmark.measure("aco.context.hooks", async () => {
            await createAcoHooks(context);
        });
    });
};
