import { createHandlerOnRequest } from "@webiny/handler";

export const setupEventsTenant = () => {
    return createHandlerOnRequest(async request => {
        const isEventBridgeEvent = request.url === "/webiny-eventBridge-event";

        if (isEventBridgeEvent) {
            request.headers = {
                ...request.headers,
                "x-tenant": request.headers["x-tenant"] || "root"
            };
        }

        return;
    });

    // return createModifyFastifyPlugin(app => {
    //     const handlerOnRequest = createHandlerOnRequest(async request => {
    //         const isEventBridgeEvent = request.url === "/webiny-eventBridge-event";
    //
    //         if (isEventBridgeEvent) {
    //             request.headers = {
    //                 ...request.headers,
    //                 "x-tenant": request.headers["x-tenant"] || "root"
    //             };
    //         }
    //
    //         return;
    //     });
    //
    //     const configPlugins = app.webiny.plugins
    //         .byType<EventBridgeEventHandler<"any", any>>(EventBridgeEventHandler.type)
    //         .reverse();
    //
    //     console.log("configPlugins", configPlugins);
    //
    //     app.webiny.plugins.register(handlerOnRequest);
    // });
};
