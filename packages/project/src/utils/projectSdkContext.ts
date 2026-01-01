import { type ProjectSdkParamsService } from "~/abstractions/index.js";

export const WBY_PROJECT_SDK_CONTEXT = "WBY_PROJECT_SDK_CONTEXT";

export interface ProjectSdkContext {
    env?: string;
    variant?: string;
    region?: string;
    productionEnvironments?: string[];
}

/**
 * Serializes ProjectSdk context to a Base64-encoded JSON string suitable for env vars.
 */
export function serializeProjectSdkContext(
    params: ProjectSdkParamsService.Params,
    productionEnvironments?: string[]
): string {
    const context: ProjectSdkContext = {
        env: params.env,
        variant: params.variant,
        region: params.region,
        productionEnvironments
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

/**
 * Extracts production environments from a rendered config DTO.
 * This includes both default production environments and any user-defined ones
 * from ProductionEnvironments extensions in the config.
 */
export function extractProductionEnvironmentsFromConfig(
    configDto: Record<string, any>
): string[] {
    const defaultProductionEnvironments = ["prod", "production"];
    
    // Look for ProductionEnvironments extensions
    const productionEnvironmentsKey = "Infra/ProductionEnvironments";
    const productionEnvironmentsExts = configDto[productionEnvironmentsKey];
    
    if (!productionEnvironmentsExts) {
        return defaultProductionEnvironments;
    }
    
    // Handle both single extension and array of extensions
    const extsArray = Array.isArray(productionEnvironmentsExts)
        ? productionEnvironmentsExts
        : [productionEnvironmentsExts];
    
    const userDefinedEnvironments: string[] = [];
    for (const ext of extsArray) {
        if (ext.environments && Array.isArray(ext.environments)) {
            userDefinedEnvironments.push(...ext.environments);
        }
    }
    
    // Combine default and user-defined, ensure uniqueness, and sort
    const allEnvironments = [...defaultProductionEnvironments, ...userDefinedEnvironments];
    return Array.from(new Set(allEnvironments)).sort();
}
