import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { DbFeature } from "@webiny/handler-db";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import type { HcmsTasksContext } from "~/types";
import { HcmsTasksFeature } from "~/HcmsTasksFeature.js";

type Params = Omit<UseContextHandlerParams, "features">;

export const useHandler = <C extends HcmsTasksContext = HcmsTasksContext>(params: Params = {}) => {
    const inner = useContextHandler<C>({
        ...params,
        features: container => {
            // cms-tasks resolves the DI DbInstance (key-value store). The shared cms-ddb storage
            // preset only sets the legacy ctx.db via dbPlugins, so register DbFeature here.
            DbFeature.register(container, {
                documentClient: getDocumentClient(),
                table: process.env.DB_TABLE
            });
            HcmsTasksFeature.register(container);
        }
    });

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        elasticsearch: createTestOpenSearchClient(),
        handler: inner.context
    };
};
