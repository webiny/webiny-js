import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { CreateApwContextParams } from "~/scheduler/types";
import { decodeToken, TOKEN_PREFIX } from "~/scheduler/handlers/utils";
import { ApwContext } from "~/types";

export const createCustomAuth = ({ storageOperations }: CreateApwContextParams) => {
    return new ContextPlugin<ApwContext>(({ security }) => {
        let hasApwToken = false;

        security.addAuthenticator(async token => {
            if (!token.startsWith(TOKEN_PREFIX)) {
                return null;
            }

            const { id, tenant, locale } = decodeToken(token);
            // Load record from DB.
            const item = await storageOperations.get({
                where: {
                    id,
                    tenant,
                    locale
                }
            });

            if (!item) {
                return null;
            }

            hasApwToken = true;

            return item.createdBy;
        });

        security.addAuthorizer(async () => {
            if (!hasApwToken) {
                return null;
            }
            return [{ name: "*" }];
        });
    });
};
