import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import { authentication } from "webiny-api-security";
import setupProject from "./app/middleware";

export default () => {
    const webiny = setupProject();

    const app = express();

    app.use("/storage", express.static(path.join(__dirname, "/../storage")));
    app.use(
        "/graphql",
        cors(),
        bodyParser.json({ limit: "50mb" }),
        webiny.middleware(({ graphqlMiddleware }) => [
            authentication({ token: "Authorization" }),
            graphqlMiddleware()
        ])
    );

    return app;
};
