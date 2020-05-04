import mongoDbResolvers from "@webiny/api-plugin-files-resolvers-mongodb";

import useDatabase from "./useDatabase";
import useContext from "./useContext";
import useSchema from "./useSchema";
import applyMongoDb from "./mongodb";

export const createUtils = (plugins = []) => {
    const utilsId = Date.now();
    return applyMongoDb(utilsId, [mongoDbResolvers(), ...plugins], plugins => ({
        useDatabase: useDatabase(utilsId, plugins),
        useContext: useContext(plugins),
        useSchema: useSchema(plugins)
    }));
};
