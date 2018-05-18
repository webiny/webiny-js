// @flow
import { app } from "webiny-api";

export default async (params: Object) => {
    const { req } = params;

    const token =
        typeof app.config.security.token === "function"
            ? app.config.security.token(req)
            : req.get(app.config.security.token);

    if (!token) {
        return;
    }

    // Assigns identity retrieved from received token.
    req.identity = await app.services.get("authentication").verifyToken(token);
};
