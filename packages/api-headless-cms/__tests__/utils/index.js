import useDatabase from "./useDatabase";
import useApolloHandler from "./useApolloHandler";
import useCopyHandler from "./useCopyHandler";
import useContext from "./useContext";
import useSchema from "./useSchema";
import applyMongoDb from "./mongodb";

export const createUtils = (plugins = []) => {
    return applyMongoDb(plugins, plugins => ({
        useDatabase: useDatabase(plugins),
        useApolloHandler: useApolloHandler(plugins),
        useCopyHandler: useCopyHandler(plugins),
        useContext: useContext(plugins),
        useSchema: useSchema(plugins),
    }));
};
