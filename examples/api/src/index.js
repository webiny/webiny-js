import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import { authentication } from "webiny-api-security";
import setupProject from "./app/middleware";
import { app as webiny, Entity } from "webiny-api";

export default () => {
    setupProject();

    const app = express();

    app.use("/storage", express.static(path.join(__dirname, "/../storage")));
    app.use(
        "/graphql",
        cors(),
        bodyParser.json({ limit: "50mb" }),
        webiny.middleware(({ graphqlMiddleware }) => [
            authentication({ token: "Authorization" }),
            //authorization(),
            graphqlMiddleware(),
            (params, next) => {
                // This will flush all entities stored in a special per-request entity pool.
                // In most cases, this should be the last step of the middleware chain.
                // @see "packages/webiny-api/src/entities/entity.js".
                Entity.pool.flush();
                next();
            }
        ])
    );

    return app;
};
