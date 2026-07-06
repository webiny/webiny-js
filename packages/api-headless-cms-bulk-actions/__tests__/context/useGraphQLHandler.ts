import { getIntrospectionQuery } from "graphql";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import { HeadlessCmsContextualSchema } from "@webiny/api-headless-cms/HeadlessCmsContextualSchema.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms/testing";
import { until } from "@webiny/project-utils/testing/helpers/until.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import {
    createBackgroundTaskContext,
    createBackgroundTaskGraphQL
} from "@webiny/background-tasks/api";
import { createHcmsBulkActions } from "~/index";
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
        query: strading;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { plugins = [] } = params;

    const extraCmsPlugins = ([plugins] as any[]).flat(Infinity as 1).filter(Boolean);

    // createBackgroundTaskContext/GraphQL and createHcmsBulkActions are legacy gql plugins applied
    // via the contextual-schema path on /graphql (after the CMS contextual schema).
    const latePlugins = [
        createBackgroundTaskContext(),
        createBackgroundTaskGraphQL(),
        createHcmsBulkActions()
    ]
        .flat(Infinity as 1)
        .filter(Boolean);

    const { handler, invoke } = createCmsTestHandler({
        identity: params.identity ?? createIdentity(),
        permissions: params.permissions ?? (createPermissions() as SecurityPermission[]),
        testProjectLicense: params.testProjectLicense,
        extraCmsPlugins,
        features: container => {
            container.register(HeadlessCmsContextualSchema);
            registerLegacyPluginsViaGqlContextualSchema(container, latePlugins);
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
