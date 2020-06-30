import { createHandler } from "@webiny/handler";
import neDb from "@webiny/api-plugin-commodo-nedb";
import { Database } from "@commodo/fields-storage-nedb";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import { dataManagerPlugins } from "../mocks/dataManagerClient";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";
import headlessCmsPlugins from "@webiny/api-headless-cms/plugins";

export default ({ database } = {}) => {
    if (!database) {
        database = new Database();
    }

    const createCmsHandler = () =>
        createHandler(
            neDb({ database }),
            apolloServerPlugins(),
            securityServicePlugins({
                token: {
                    secret: "secret"
                }
            }),
            settingsManagerPlugins({ functionName: process.env.SETTINGS_MANAGER_FUNCTION }),
            headlessCmsPlugins(),
            dataManagerPlugins()
        );

    const cmsHandler = createCmsHandler();

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await cmsHandler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        return [JSON.parse(response.body), response];
    };

    return {
        database,
        cmsHandler,
        invoke
    };
};
