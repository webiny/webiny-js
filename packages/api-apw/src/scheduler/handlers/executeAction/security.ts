import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";
import { CreateApwContextParams } from "~/scheduler/types";
import { decodeToken, TOKEN_PREFIX } from "~/scheduler/handlers/utils";

export const createCustomAuth = ({ storageOperations }: CreateApwContextParams) => {
    return new ContextPlugin<SecurityContext>(({ security }) => {
        let hasApwToken = false;

        security.addAuthenticator(async token => {
            if (!token.startsWith(TOKEN_PREFIX)) {
                return null;
            }

            const { id, tenant, locale } = decodeToken(token);
            /**
             * No point in going further if any piece of information is missing.
             */
            if (!id || !tenant || !locale) {
                return null;
            }
            /**
             * We must verify that action we are trying to execute actually exists.
             */
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
