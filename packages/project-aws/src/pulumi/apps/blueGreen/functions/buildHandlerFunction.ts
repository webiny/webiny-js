import { existsSync, readFileSync } from "fs";

export interface IBuildRequestFunctionParamsDomain {
    /**
     * Name of the deployment (eg. green, blue, orange, etc.).
     */
    name: string;
    sourceDomain: string;
    targetOriginId: string;
    targetDomain: string;
}

export interface IBuildRequestFunctionParams {
    storeId: string;
    storeKey: string;
    domains: IBuildRequestFunctionParamsDomain[];
}

export const buildHandlerFunction = ({
    storeId,
    storeKey,
    domains
}: IBuildRequestFunctionParams): string => {
    const target = __dirname + `/handler.mjs`;
    if (!existsSync(target)) {
        throw new Error(`File "${target}" does not exist.`);
    }
    const content = readFileSync(target, "utf8");
    if (!content) {
        throw new Error(`File "${target}" is empty.`);
    }

    return content
        .replace("{BLUE_GREEN_ROUTER_STORE_ID}", storeId)
        .replace("{BLUE_GREEN_ROUTER_STORE_KEY}", storeKey)
        .replace(`"{BLUE_GREEN_ROUTER_DOMAINS}"`, JSON.stringify(domains));
};
