import { createRegisterExtensionPlugin } from "@webiny/handler";
import { default as DynamoDbDriver } from "./DynamoDbDriver.js";
import { ValueFilterFeature } from "~/feature/ValueFilter/index.js";

export * from "./utils/index.js";
export * from "./plugins/index.js";
export type { DbItem } from "./types.js";

export { DynamoDbDriver };

export const registerExtension = () => {
    return createRegisterExtensionPlugin(async context => {
        ValueFilterFeature.register(context.container);
    });
};
