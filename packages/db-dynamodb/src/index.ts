import { createRegisterExtensionPlugin } from "@webiny/handler";
import { default as DynamoDbDriver } from "./DynamoDbDriver.js";
import { ValueFilterFeature } from "~/feature/ValueFilter/index.js";
import { FilterUtilFeature } from "~/feature/FilterUtil/index.js";

export * from "./utils/index.js";
export * from "./plugins/index.js";
export type { DbItem } from "./types.js";

export { DynamoDbDriver };

export const registerExtension = () => {
    return createRegisterExtensionPlugin(async context => {
        FilterUtilFeature.register(context.container);
        ValueFilterFeature.register(context.container);
    });
};
