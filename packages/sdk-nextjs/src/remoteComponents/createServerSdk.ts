import * as React from "react";
import * as contentSdkNextjs from "../index.js";
import type { RemoteRuntimeSdk } from "./types.js";

export interface CreateServerSdkParams {
    tenantId: string;
    locale: string;
}

export function createServerSdk(params: CreateServerSdkParams): RemoteRuntimeSdk {
    return {
        version: "1",
        dependencies: {
            sdk: contentSdkNextjs,
            React
        },
        environment: {
            tenantId: params.tenantId,
            locale: params.locale,
            mode: "server"
        }
    };
}
