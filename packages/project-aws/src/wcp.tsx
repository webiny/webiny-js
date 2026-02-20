import React, { useEffect } from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";
import { Api } from "./api.js";
import { Admin } from "./admin.js";
import { useWcpFeatureOverrides } from "@webiny/project/components/WcpFeatureOverridesContext.js";

function WcpFeatureOverrideRegistrar({ name, enabled }: { name: string; enabled: boolean }) {
    const { setOverride } = useWcpFeatureOverrides();

    useEffect(() => {
        setOverride(name, enabled);
    }, [name, enabled, setOverride]);

    return null;
}

const WcpFeatureExtension = defineExtension({
    type: "Wcp/Feature",
    tags: { runtimeContext: "project" },
    description: "Enable or disable a WCP feature.",
    multiple: true,
    paramsSchema: z.object({
        enabled: z.boolean().describe("Whether the feature is enabled.")
    }),
    render: ({ name, enabled }) => {
        const featureName = name || "";
        const paramName = `wcp.feature.${featureName}`;
        return (
            <>
                <WcpFeatureOverrideRegistrar name={featureName} enabled={enabled} />
                <Api.BuildParam name={paramName} paramName={paramName} value={enabled} />
                <Admin.BuildParam name={paramName} paramName={paramName} value={enabled} />
            </>
        );
    }
});

export const Wcp = {
    Feature: WcpFeatureExtension
};
