import { createHandler } from "@webiny/handler";
import neDb from "@webiny/api-plugin-commodo-nedb";
import { Database } from "@commodo/fields-storage-nedb";
import { dataManagerPlugins } from "../mocks/dataManagerClient";
import i18n from "@webiny/api-i18n/plugins/i18n";
import { mockLocalesPlugins } from "@webiny/api-i18n/testing";
import dataManager from "../../src/dataManager/handler";

export default ({ database } = {}) => {
    if (!database) {
        database = new Database();
    }

    const createDataManagerHandler = () =>
        createHandler(
            neDb({ database }),
            dataManager(),
            dataManagerPlugins(),
            i18n,
            mockLocalesPlugins(),
        );

    const handler = createDataManagerHandler();

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await handler({
            httpMethod,
            // Set "full-access" JWT token into the "Authorization" header.
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        return [JSON.parse(response.body), response];
    };

    return {
        database,
        handler,
        invoke
    };
};
