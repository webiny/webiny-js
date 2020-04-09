import i18n from "@webiny/api-i18n/plugins/service";
import mockI18NLocales from "../mocks/mockI18NLocales";

import useDatabase from "./useDatabase";
import useApolloHandler from "./useApolloHandler";
import useCopyHandler from "./useCopyHandler";
import useContext from "./useContext";
import useSchema from "./useSchema";
import applyMongoDb from "./mongodb";

export const createUtils = (plugins = []) => {
    const utilsId = Date.now();
    return applyMongoDb(utilsId, [i18n(), mockI18NLocales(), ...plugins], plugins => ({
        useDatabase: useDatabase(utilsId, plugins),
        useApolloHandler: useApolloHandler(plugins),
        useCopyHandler: useCopyHandler(plugins),
        useContext: useContext(plugins),
        useSchema: useSchema(plugins)
    }));
};
