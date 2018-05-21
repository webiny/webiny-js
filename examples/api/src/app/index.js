import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import { authentication } from "webiny-api-security";
import setupProject from "./middleware";

export default () => {
    const webiny = setupProject();

    const app = express();

    if (process.env.NODE_ENV === "development") {
        const morgan = require("morgan");
        app.use(morgan("tiny"));
    }

    app.use(cors());
    app.use("/storage", express.static(path.join(__dirname, "/../../storage")));
    app.use(
        "/graphql",
        bodyParser.json({ limit: "50mb" }),
        webiny.middleware(({ graphqlMiddleware }) => [
            authentication({ token: "Authorization" }),
            graphqlMiddleware()
        ])
    );

    return app;
};
