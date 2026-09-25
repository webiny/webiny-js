import React from "react";
import debounce from "debounce";
import { ConcurrentRoot } from "react-reconciler/constants.js";
import { AsyncProperties } from "@webiny/react-properties";
import { toObject } from "@webiny/react-properties";
import { type Property } from "@webiny/react-properties";
import { type IProjectConfigDto } from "~/abstractions/models/index.js";
import { type ProjectSdkParamsService } from "~/abstractions/index.js";
import { ConfigRenderErrorBoundary } from "./ConfigRenderErrorBoundary.js";
import { EnvProvider } from "./EnvContext.js";
import { FeatureFlagsProvider } from "./FeatureFlagsContext.js";
import { nullRenderer } from "./nullRenderer.js";
import { ProductionEnvironmentsCollector } from "./ProductionEnvironmentsContext.js";
import { WcpProjectLicenseProvider } from "./WcpProjectLicenseContext.js";

const RENDER_TIMEOUT_MS = 30_000;

export interface RenderExtensionsParams {
    Extensions: React.ComponentType;
    sdkParams: ProjectSdkParamsService.Params;
}

/*
 * Renders the project's extension tree and resolves with the properties it collected. The tree
 * settles asynchronously, because an extension is free to `<Await>` something, so the result arrives
 * through `onChange` rather than as a return value from the render call.
 *
 * It renders through `nullRenderer`, which creates nothing, so there is no DOM involved and no
 * globals to install or put back.
 */
export const renderExtensions = (params: RenderExtensionsParams): Promise<IProjectConfigDto> => {
    const { Extensions, sdkParams } = params;

    return new Promise<IProjectConfigDto>((resolve, reject) => {
        // The container is what the renderer hands to the host config as the root. Ours creates
        // nothing, so an empty object is all it needs to be.
        const containerInfo = {};

        const container = nullRenderer.createContainer(
            containerInfo,
            ConcurrentRoot,
            null,
            false,
            null,
            "",
            // Recoverable errors are ones React retried its way past, so the render carried on.
            () => undefined,
            null
        );

        let settled = false;
        let timeout: ReturnType<typeof setTimeout>;

        /*
         * Every way out goes through here. It unmounts the tree, which runs the cleanup of every
         * effect in it, and it is idempotent because a timeout and a late `onChange` can both arrive.
         */
        const settle = (finish: () => void) => {
            if (settled) {
                return;
            }

            settled = true;
            clearTimeout(timeout);

            nullRenderer.updateContainer(null, container, null, null);
            finish();
        };

        timeout = setTimeout(() => {
            settle(() => {
                reject(
                    new Error(
                        `Config rendering timed out after ${RENDER_TIMEOUT_MS}ms. ` +
                            `This usually means an <Await> promise never settled.`
                    )
                );
            });
        }, RENDER_TIMEOUT_MS);

        const onChange = debounce((properties: Property[]) => {
            const config: IProjectConfigDto = toObject(properties);

            settle(() => resolve(config));
        });

        const onError = (error: Error) => {
            settle(() => reject(error));
        };

        const tree = (
            <ConfigRenderErrorBoundary onError={onError}>
                <WcpProjectLicenseProvider>
                    <FeatureFlagsProvider>
                        <EnvProvider
                            env={sdkParams.env}
                            variant={sdkParams.variant}
                            region={sdkParams.region}
                        >
                            <ProductionEnvironmentsCollector>
                                <AsyncProperties onChange={onChange}>
                                    <Extensions />
                                </AsyncProperties>
                            </ProductionEnvironmentsCollector>
                        </EnvProvider>
                    </FeatureFlagsProvider>
                </WcpProjectLicenseProvider>
            </ConfigRenderErrorBoundary>
        );

        nullRenderer.updateContainer(tree, container, null, null);
    });
};
