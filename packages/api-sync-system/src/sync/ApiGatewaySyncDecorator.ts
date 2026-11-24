import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayInputHandler } from "@webiny/kernel-aws/abstractions/handlers/ApiGatewayInputHandler.js";
import { PluginsContainer } from "@webiny/plugins";
import type { InputContext, NextFunction } from "@webiny/kernel-core";
import { SyncSystemConfig } from "./SyncSystemConfig.js";
import type { ISyncSystemConfig } from "./SyncSystemConfig.js";
import { createHandler } from "~/sync/createHandler.js";
import { getManifest } from "~/sync/utils/manifest.js";
import { decorateClientWithHandler } from "~/sync/attachToDynamoDbDocument.js";
import { createDefaultFilterOutRecordPlugins } from "~/sync/filter/createDefaultFilterOutRecordPlugins.js";

class ApiGatewaySyncDecoratorImpl implements ApiGatewayInputHandler.Interface {
    constructor(
        private config: ISyncSystemConfig,
        private inner: ApiGatewayInputHandler.Interface
    ) {}

    async execute(ctx: InputContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const { data: manifest, error } = await getManifest();
        if (error || !manifest?.sync?.region) {
            if (process.env.DEBUG === "true") {
                console.warn("[ApiGatewaySyncDecorator] Manifest not available — sync disabled.");
            }
            return this.inner.execute(ctx, next);
        }

        const filterPlugins = [
            ...createDefaultFilterOutRecordPlugins(),
            ...(this.config.plugins || [])
        ];

        const { handler } = createHandler({
            getEventBridgeClient: this.config.getEventBridgeClient,
            system: this.config.system,
            manifest,
            getPlugins: () => new PluginsContainer(filterPlugins)
        });

        const documentClient = this.config.getDocumentClient();
        decorateClientWithHandler({ handler, client: documentClient as any });

        try {
            return await this.inner.execute(ctx, next);
        } finally {
            await handler.flush();
        }
    }
}

export const ApiGatewaySyncDecorator = ApiGatewayInputHandler.createDecorator({
    decorator: ApiGatewaySyncDecoratorImpl,
    dependencies: [SyncSystemConfig]
});
