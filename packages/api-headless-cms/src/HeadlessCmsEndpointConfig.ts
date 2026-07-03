import { Abstraction } from "@webiny/di";
import type { ApiEndpoint } from "~/types/index.js";

/**
 * The CMS endpoint type ("manage" | "read" | "preview") for the current handler, set in
 * HeadlessCmsFeature.register() and read by the schema builders / contextual schema.
 */
export interface IHeadlessCmsEndpointConfig {
    type: ApiEndpoint;
}

export const HeadlessCmsEndpointConfig = new Abstraction<IHeadlessCmsEndpointConfig>(
    "HeadlessCmsEndpointConfig"
);
