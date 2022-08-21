import { createHandler } from "@webiny/handler-aws/raw";
import queueProcessPlugins from "~/queue/process";
import { getStorageOperations } from "../../../../storageOperations";

export default (...plugins: any[]) => {
    const storageOperations = getStorageOperations();

    const handler = createHandler({
        plugins: [
            ...plugins,
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
