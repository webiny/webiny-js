import { createRoute } from "@webiny/handler";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { ActiveRedirectRestMapper } from "./ActiveRedirectRestMapper.js";
import { GetActiveRedirectsUseCase } from "~/features/redirects/GetActiveRedirects/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export const createRedirectsRoute = () => {
    return createRoute<ApiCoreContext>(({ onGet, context }) => {
        onGet("/wb/redirects", async (_, reply) => {
            try {
                ensureAuthentication(context);
            } catch (err) {
                if (err.code === "SECURITY_NOT_AUTHORIZED") {
                    reply.code(401).send(err.message);
                } else {
                    reply.code(500).send(err.message);
                }
                return;
            }

            const getActiveRedirects = context.container.resolve(GetActiveRedirectsUseCase);

            const result = await getActiveRedirects.execute();
            if (result.isFail()) {
                return reply.code(500).send(result.error);
            }

            const redirectsDto = result.value.map(entry => ActiveRedirectRestMapper.toDto(entry));

            // The response depends on the caller and the tenant: shared caches (CDN) must not
            // store it, and clients may only reuse it briefly.
            reply.headers({
                "content-type": "application/json",
                "Cache-Control": "private, max-age=300",
                Vary: "Authorization, x-tenant"
            });

            return reply.send(redirectsDto);
        });
    });
};
