import React from "react";
import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { EnvVar } from "./EnvVar.js";

/**
 * Sets a dedicated WebSocket URL for the Admin app, baked into the admin bundle as
 * `WEBINY_ADMIN_WS_API_URL`. This is optional: when omitted, the admin derives the WebSocket URL
 * from the API URL (same origin, http -> ws), which is what the self-hosted server flavour needs by
 * default. Set it only when WebSockets are served from a different origin than the API. Because the
 * config is evaluated at build time, the value can come from any env var the user chooses, e.g.
 * `<Admin.WebsocketsUrl url={process.env.MY_WS_URL} />`.
 */
export const AdminWebsocketsUrl = defineExtension({
    type: "Admin/WebsocketsUrl",
    tags: { runtimeContext: "project" },
    description: "Set a dedicated WebSocket URL for the Admin app.",
    paramsSchema: z.object({
        url: z
            .string()
            .describe("The WebSocket origin, e.g. wss://ws.example.com or ws://localhost:3002")
    }),
    render: props => {
        return <EnvVar varName="WEBINY_ADMIN_WS_API_URL" value={props.url} />;
    }
});
