import "cross-fetch/polyfill";
import "url-search-params-polyfill";
import path from "path";
import express from "express";
import proxy from "express-http-proxy";
import chalk from "chalk";
import expressRequestToLambdaEvent from "../utils/expressRequestToLambdaEvent";

export const server = ({ root, port = process.env.PORT || 8888 }) => {
    const { handler } = require(path.join(root, "build", "ssr.js"));

    const app = express();

    app.use(
        "/files",
        proxy(process.env.REACT_APP_FUNCTIONS_HOST, {
            proxyReqPathResolver: req => "/files" + req.url
        })
    );

    app.use(
        "/function",
        proxy(process.env.REACT_APP_FUNCTIONS_HOST, {
            proxyReqPathResolver: req => "/function" + req.url
        })
    );

    app.use("/static", express.static(path.join(root, "build/static"), { index: false }));

    app.use(async (req, res) => {
        if (req.url.includes(".")) {
            res.status(200);
            res.send(`NOT AN API`);
            res.end();
            return;
        }

        const event = expressRequestToLambdaEvent(req);
        const html = await handler(event);

        res.status(200);
        res.send(`<!DOCTYPE html>${html}`);
        res.end();
    });

    app.listen(port, () => {
        console.log(`\n${chalk.blue(">")} SSR server listening on port ${chalk.magenta(port)}...`);
    });
};
