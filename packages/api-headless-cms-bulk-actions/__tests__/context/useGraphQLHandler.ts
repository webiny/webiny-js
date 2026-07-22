import { getIntrospectionQuery } from "graphql";
import { HeadlessCmsContextualSchema } from "@webiny/api-headless-cms/HeadlessCmsContextualSchema.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import { until } from "@webiny/project-utils/testing/helpers/until.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";
import { HcmsBulkActionsFeature } from "~/index";
import { createIdentity, createPermissions } from "~tests/context/helpers";

export interface UseGQLHandlerParams {
    identity?: IdentityData;
    permissions?: SecurityPermission[];
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
    testProjectLicense?: DecryptedWcpProjectLicense;
}

interface InvokeParams {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { plugins = [] } = params;

    const allPlugins = ([plugins] as any[]).flat(Infinity as 1).filter(Boolean);
    // DI-native plugins are plain `container => {}` functions → the `legacyPlugins` param
    // (createCmsTestHandler calls them after `setup`). Static CMS plugins (e.g. model plugins) →
    // extraCmsPlugins.
    const isFn = (p: any) => typeof p === "function" && !p.prototype;
    const fnPlugins = allPlugins.filter(isFn);
    const extraCmsPlugins = allPlugins.filter(p => !isFn(p));

    const { handler, invoke } = createCmsTestHandler({
        identity: params.identity ?? createIdentity(),
        permissions: params.permissions ?? (createPermissions() as SecurityPermission[]),
        testProjectLicense: params.testProjectLicense,
        extraCmsPlugins,
        legacyPlugins: fnPlugins,
        setup: container => {
            container.register(HeadlessCmsContextualSchema);
            // Background tasks + bulk actions are DI-native now.
            BackgroundTasksFeature.register(container);
            HcmsBulkActionsFeature.register(container);
        }
    });

    const introspect = async () => {
        return invoke({
            body: {
                query: getIntrospectionQuery()
            }
        });
    };

    return {
        params,
        until,
        handler,
        invoke: (p: InvokeParams) => invoke(p),
        introspect
    };
};
