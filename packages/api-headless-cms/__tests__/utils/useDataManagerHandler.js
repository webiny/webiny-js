import { createHandler } from "@webiny/handler";
import dataManager from "../../src/dataManager/handler";

const createDataManagerHandler = plugins => createHandler(plugins, dataManager());

export default plugins => () => {
    const handler = createDataManagerHandler(plugins);
    return {
        handler,
        invoke: async event => {
            const response = await handler(event);

            return [JSON.parse(response.body), response];
        }
    };
};
