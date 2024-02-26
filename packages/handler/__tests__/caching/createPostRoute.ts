import { createRoute } from "~/plugins/RoutePlugin";

export const createPostRoute = () => {
    return createRoute(({ onPost }) => {
        onPost("/webiny-post", async (_, reply) => {
            return reply.code(200).send({
                aResponseValue: 1
            });
        });
    });
};
