import { createHandler } from "@webiny/handler-fastify-aws/raw";
import queueProcessPlugins from "@webiny/api-prerendering-service/queue/process";
import handlerClient from "@webiny/handler-client";
import { getStorageOperations } from "../../../../storageOperations";

export default (...plugins: any[]) => {
    const storageOperations = getStorageOperations();

    const handler = createHandler({
        plugins: [
            ...plugins,
            handlerClient(),
            queueProcessPlugins({
                handlers: {
                    render: "handler-client-handler-render-handler",
                    flush: "handler-client-handler-flush-handler"
                },
                storageOperations
            })
        ]
    });

    return { handler, storageOperations };
};
