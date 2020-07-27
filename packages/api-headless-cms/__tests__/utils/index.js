import i18n from "@webiny/api-i18n/plugins/i18n";
import I18NLocales from "../mocks/I18NLocales";
import { dataManagerPlugins } from "../mocks/dataManagerClient";

import useDatabase from "./useDatabase";
import useApolloHandler from "./useApolloHandler";
import useContentHandler from "./useContentHandler";
import useContext from "./useContext";
import useSchema from "./useSchema";
import applyMongoDb from "./mongodb";
import useDataManagerHandler from "./useDataManagerHandler";

export const createUtils = (plugins = []) => {
    const utilsId = Date.now();
    return applyMongoDb(
        utilsId,
        [i18n, I18NLocales(), ...plugins, dataManagerPlugins()],
        plugins => ({
            useDatabase: useDatabase(utilsId, plugins),
            useApolloHandler: useApolloHandler(plugins),
            useContentHandler: useContentHandler(plugins),
            useContext: useContext(plugins),
            useDataManagerHandler: useDataManagerHandler(plugins),
            useSchema: useSchema(plugins)
        })
    );
};
