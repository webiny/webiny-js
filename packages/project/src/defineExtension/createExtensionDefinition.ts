import { ExtensionDefinitionModel } from "./models/index.js";
import type { DefineExtensionParams } from "./types.js";
import type { z } from "zod";

export function createExtensionDefinition<TParamsSchema extends z.ZodTypeAny>(
    extensionParams: DefineExtensionParams<TParamsSchema>
) {
    const { type, description, multiple, build, validate, tags, paramsSchema } = extensionParams;

    return new ExtensionDefinitionModel<TParamsSchema>({
        type,
        tags,
        description: description || "",
        array: multiple || false,
        paramsSchema,
        build,
        validate
    });
}
