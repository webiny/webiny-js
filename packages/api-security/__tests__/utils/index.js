import useDatabase from "./useDatabase";
import useHandler from "./useHandler";
import useSchema from "./useSchema";
import applyMongoDb from "./mongodb";

export const createUtils = (plugins = []) => {
    const utilsId = Date.now();
    return applyMongoDb(utilsId, plugins, plugins => ({
        useDatabase: useDatabase(utilsId, plugins),
        useHandler: useHandler(plugins),
        useSchema: useSchema(plugins)
    }));
};
