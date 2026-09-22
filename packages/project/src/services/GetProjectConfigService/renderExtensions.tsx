import React from "react";
import debounce from "debounce";
import { createRoot } from "react-dom/client";
import { AsyncProperties } from "@webiny/react-properties";
import { toObject } from "@webiny/react-properties";
import { type Property } from "@webiny/react-properties";
import { type IProjectConfigDto } from "~/abstractions/models/index.js";
import { type ProjectSdkParamsService } from "~/abstractions/index.js";
import { ConfigRenderErrorBoundary } from "./ConfigRenderErrorBoundary.js";
import { EnvProvider } from "./EnvContext.js";
import { FeatureFlagsProvider } from "./FeatureFlagsContext.js";
import { ProductionEnvironmentsCollector } from "./ProductionEnvironmentsContext.js";
import { WcpProjectLicenseProvider } from "./WcpProjectLicenseContext.js";
import { withDomGlobals } from "./withDomGlobals.js";

const RENDER_TIMEOUT_MS = 30_000;

export interface RenderExtensionsParams {
    Extensions: React.ComponentType;
    sdkParams: ProjectSdkParamsService.Params;
}

/*
 * Renders the project's extension tree and resolves with the properties it collected. The tree
 * settles asynchronously, because an extension is free to `<Await>` something, so the result arrives
 * through `onChange` rather than as a return value from `render`.
 */
export const renderExtensions = (params: RenderExtensionsParams): Promise<IProjectConfigDto> => {
    const { Extensions, sdkParams } = params;

    return withDomGlobals(container => {
        return new Promise<IProjectConfigDto>((resolve, reject) => {
            const reactRoot = createRoot(container);

            const timeout = setTimeout(() => {
                reject(
                    new Error(
                        `Config rendering timed out after ${RENDER_TIMEOUT_MS}ms. ` +
                            `This usually means an <Await> promise never settled.`
                    )
                );
            }, RENDER_TIMEOUT_MS);

            /*
             * Unmount on a later tick, because React is mid-commit when `onChange` fires and will
             * not unmount from inside its own render. Settling only afterwards matters: the DOM
             * globals are torn down as soon as this promise resolves, and `unmount` commits one last
             * time, so it has to happen while `window` still exists.
             */
            const settle = (finish: () => void) => {
                clearTimeout(timeout);

                setTimeout(() => {
                    reactRoot.unmount();
                    finish();
                }, 0);
            };

            const onChange = debounce((properties: Property[]) => {
                const config: IProjectConfigDto = toObject(properties);

                settle(() => resolve(config));
            });

            const onError = (error: Error) => {
                settle(() => reject(error));
            };

            reactRoot.render(
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
        });
    });
};
