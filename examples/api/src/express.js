import express from "express";
import cors from "cors";
import { app as webiny } from "webiny-api";
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

    app.get("/import/users", async (req, res) => {
        await import("./import/users");
        res.json({ data: "success" });
    });

    app.get("/import/cms", async (req, res) => {
        await import("./import/cms");
        res.json({ data: "success" });
    });

    app.get("/api/discover", async (req, res) => {
        const onlySpecificEndpoints = Array.isArray(req.query.include);
        const excludeEndpoints = Array.isArray(req.query.exclude);
        const usages = req.query.usages;

        const endpoints = [];
        for (let i in webiny.endpoints) {
            const endpoint = webiny.endpoints[i];
            if (onlySpecificEndpoints) {
                if (!req.query.include.includes(endpoint.classId)) {
                    continue;
                }
            }
            const current = { classId: endpoint.classId, url: i, methods: [] };
            const instance = new endpoint.versions[endpoint.latest]();
            const apiMethods = instance.getApi().getMethods();
            Object.keys(apiMethods).forEach(name => {
                current["methods"].push(apiMethods[name].toJSON());
            });

            if (excludeEndpoints) {
                if (req.query.exclude.includes(current.classId)) {
                    continue;
                }
            }

            if (usages) {
                if (req.query.exclude.includes(current.classId)) {
                    continue;
                }
            }

            endpoints.push(current);
        }

        res.json({ data: { list: endpoints } });
    });

    const mw = middleware(process.env);
    app.use("/api", mw);

    return app;
};
