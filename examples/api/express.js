import express from "express";
import webiny from "webiny-api";
import middleware from "./configs/middleware";

export default async () => {
    // Configure express app
    const app = express();
    app.use(express.json());

    app.get("/setup", async (req, res) => {
        await import("./setup");
        res.json({ data: "success" });
    });

    app.get("/discover", async (req, res) => {
        const methods = {};
        Object.keys(webiny.endpoints).forEach(key => {
            methods[key] = [];
            const endpoint = webiny.endpoints[key];
            const instance = new endpoint.versions[endpoint.latest]();
            const apiMethods = instance.getApi().getMethods();
            Object.keys(apiMethods).forEach(name => {
                methods[key].push(apiMethods[name].toJSON());
            });
        });
        res.json(methods);
    });

    app.use(await middleware(process.env));

    return app;
};
