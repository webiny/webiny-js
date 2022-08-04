import { createHandler } from "@webiny/handler-aws/gateway";
import pageBuilderPlugins from "../../src/updateSettings";
import { getStorageOperations } from "../storageOperations";

interface Params {
    plugins?: any;
    storageOperationPlugins?: any[];
}
export default (params: Params = {}) => {
    const { plugins: extraPlugins = [] } = params;
    const ops = getStorageOperations({
        plugins: params.storageOperationPlugins || []
    });
    const handler = createHandler({
        plugins: [
            ...ops.plugins,
            pageBuilderPlugins({
                storageOperations: ops.storageOperations
            }),
            extraPlugins || []
        ]
    });

    return {
        handler
    };
};
