import express from "express";
import cors from "cors";
import webiny from "webiny-api";
import bodyParser from "body-parser";
//import monitor from "express-status-monitor";
import middleware from "./configs/middleware";

export default () => {
    // Configure express app
    const app = express();
    //app.use(monitor());
    app.use(bodyParser.json({ limit: "50mb" }));
    app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
    app.use(cors());

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

    const mw = middleware(process.env);
    app.use("/api", mw);

    return app;
};
