import { createHandler } from "@webiny/handler";
import queueProcessPlugins from "~/queue/process";
import handlerClient from "@webiny/handler-client";
import { getStorageOperations } from "../../../../storageOperations";

export default (...plugins) => {
    let storageOperations: any = {};
    try {
        storageOperations = getStorageOperations();
    } catch (ex) {
        console.log(ex.message);
    }

    const handler = createHandler(
        ...plugins,
        handlerClient(),
        queueProcessPlugins({
            handlers: {
                render: "handler-client-handler-render-handler",
                flush: "handler-client-handler-flush-handler"
            },
            storageOperations
        })
    );

    return { handler, storageOperations };
};
