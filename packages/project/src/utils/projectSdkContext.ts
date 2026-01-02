import { type ProjectSdkParamsService } from "~/abstractions/index.js";

export const WBY_PROJECT_SDK_CONTEXT = "WBY_PROJECT_SDK_CONTEXT";

export interface ProjectSdkContext {
    env?: string;
    variant?: string;
    region?: string;
}

/**
 * Serializes ProjectSdk context to a Base64-encoded JSON string suitable for env vars.
 */
export function serializeProjectSdkContext(params: ProjectSdkParamsService.Params): string {
    const context: ProjectSdkContext = {
        env: params.env,
        variant: params.variant,
        region: params.region
    };

    // Remove undefined values to keep the serialized string minimal
    Object.keys(context).forEach(key => {
        if (context[key as keyof ProjectSdkContext] === undefined) {
            delete context[key as keyof ProjectSdkContext];
        }
    });

    return Buffer.from(JSON.stringify(context)).toString("base64");
}

/**
 * Deserializes ProjectSdk context from a Base64-encoded JSON string.
 */
export function deserializeProjectSdkContext(encoded: string): ProjectSdkContext {
    try {
        const json = Buffer.from(encoded, "base64").toString("utf-8");
        return JSON.parse(json);
    } catch (error) {
        throw new Error(`Failed to deserialize WBY_PROJECT_SDK_CONTEXT: ${error.message}`);
    }
}

/**
 * Gets ProjectSdk context from the environment variable if present.
 */
export function getProjectSdkContextFromEnv(): ProjectSdkContext | null {
    const encoded = process.env[WBY_PROJECT_SDK_CONTEXT];
    if (!encoded) {
        return null;
    }
    return deserializeProjectSdkContext(encoded);
}
