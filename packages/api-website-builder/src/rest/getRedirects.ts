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

            const redirectsDto = result.value.map(entry => ActiveRedirectRestMapper.toDto(entry));

            reply.headers({
                "content-type": "application/json",
                "Cache-Control": "public, max-age=31536000"
            });

            return reply.send(redirectsDto);
        });
    });
};
