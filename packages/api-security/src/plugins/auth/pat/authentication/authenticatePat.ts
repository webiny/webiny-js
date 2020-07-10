import { Context } from "@webiny/graphql/types";
import { SecurityOptions } from "../../types";
import { AccessToken } from "./AccessToken";

export default (options: SecurityOptions) => async (context: Context) => {
    const { event } = context;
    const { headers = {} } = event;
    const authorization = headers["Authorization"] || headers["authorization"] || "";

    if (!authorization) {
        return;
    }

    const token = new AccessToken({
        token: authorization,
        validateAccessTokenFunction: options.validateAccessTokenFunction
    });
    const user = await token.getUser();

    context.security.token = token.token;
    context.security.user = user;
};
