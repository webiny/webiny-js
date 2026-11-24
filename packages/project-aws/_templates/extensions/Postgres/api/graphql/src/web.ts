/**
 * Entry of the Lambda web function, built unless the project sets
 * `<Infra.Api.WebFunction enabled={false} />`.
 *
 * Unlike `index.ts`, importing this module starts an HTTP server, so it is a separate entry and a
 * separate bundle (`build-web/`), never part of `handler.mjs`. The web function serves the HTTP routes;
 * every other invocation still goes to the regular `graphql` Lambda built from `index.ts`.
 */
import { startAwsPgWebApi } from "@webiny/api-kernel-aws-pg";
import { extensions } from "./extensions";

startAwsPgWebApi({ extensions }).catch(err => {
    console.error("Failed to start the web API server.", err);
    process.exit(1);
});
