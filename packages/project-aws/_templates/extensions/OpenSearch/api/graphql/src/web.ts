/**
 * Entry of the Lambda web function, built only when `<Infra.Api.WebFunction enabled />` is set.
 *
 * Unlike `index.ts`, importing this module starts an HTTP server, so it is a separate entry and a
 * separate bundle (`build-web/`), never part of `handler.mjs`. The web function serves the HTTP routes;
 * every other invocation still goes to the regular `graphql` Lambda built from `index.ts`.
 */
import { startAwsDdbOsWebApi } from "@webiny/api-event-handler-aws-ddb-os";
import { extensions } from "./extensions";

startAwsDdbOsWebApi({ extensions }).catch(err => {
    console.error("Failed to start the web API server.", err);
    process.exit(1);
});
