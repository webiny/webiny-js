import { createHandler } from "@webiny/handler";
import queueProcessPlugins from "~/queue/process";
import handlerClient from "@webiny/handler-client";
import { getStorageOperations } from "../../../../storageOperations";

export default (...plugins) => {
    const storageOperations = getStorageOperations();

    const handler = createHandler(
        ...plugins,
        handlerClient(),
        queueProcessPlugins({
            storageOperations,
            handlers: {
                render: "handler-client-handler-render-handler",
                flush: "handler-client-handler-flush-handler"
            }
        })
    );

    return { handler, storageOperations };
};
