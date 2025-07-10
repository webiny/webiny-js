import type { PulumiApp } from "@webiny/pulumi";

export interface IAppWithRegionParams {
    app: PulumiApp;
    protect?: boolean;
}

export const customApp = (params: IAppWithRegionParams) => {
    const { app, protect } = params;

    const initialAddResource = app.addResource;

    app.addResource = (resource, params) => {
        return initialAddResource(resource, {
            ...params,
            opts: {
                protect,
                ...params.opts
            }
        });
    };

    return app;
};
