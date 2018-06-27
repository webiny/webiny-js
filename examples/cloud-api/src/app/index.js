import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import setupProject from "./middleware";

export default async () => {
    const webiny = await setupProject();

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
        await webiny.middleware(({ securityMiddleware, graphqlMiddleware }) => [
            securityMiddleware(),
            graphqlMiddleware()
        ])
    );

    return app;
};
