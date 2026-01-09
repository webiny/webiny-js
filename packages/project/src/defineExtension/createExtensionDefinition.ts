import { ExtensionDefinitionModel } from "./models/index.js";
import type { DefineExtensionParams } from "./types.js";
import type { ParamsSchemaDefinition } from "./types.js";

export function createExtensionDefinition<TParamsSchema extends ParamsSchemaDefinition | undefined>(
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
