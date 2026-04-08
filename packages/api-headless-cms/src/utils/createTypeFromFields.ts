import { renderField } from "~/utils/renderFields.js";
import { renderInputField } from "~/utils/renderInputFields.js";
import type { ApiEndpoint, CmsModel, CmsModelField } from "~/types/index.js";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface TypeFromFieldParams {
    typeOfType: "type" | "input";
    models: CmsModel[];
    model: CmsModel;
    type: ApiEndpoint;
    typeNamePrefix: string;
    fields: CmsModelField[];
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

interface TypeFromFieldResponse {
    fieldType: string;
    typeDefs: string;
}

export const createTypeFromFields = (params: TypeFromFieldParams): TypeFromFieldResponse | null => {
    const { typeOfType, model, models, type, typeNamePrefix, fields, fieldRegistry } = params;
    const typeSuffix = typeOfType === "input" ? "Input" : "";
    const mTypeName = model.singularApiName;

    const typeFields: string[] = [];
    const nestedTypes: string[] = [];

    // Once the loop below starts, we'll be executing a recursive "object" type generation.
    // The main trick here is that nested objects don't know who the parent is, and will generate
    // type names using the "model", as if they're at the top level:
    // Every time the types are returned, we need to replace the model name in the generated type name
    // with the actual prefix which includes parent field name type.
    const replace = new RegExp(`${mTypeName}_`, "g");

    for (const field of fields) {
        const result =
            typeOfType === "type"
                ? renderField({ field, type, models, model, fieldRegistry })
                : renderInputField({ field, models, model, fieldRegistry });

        if (!result) {
            continue;
        }

        const { fields, typeDefs } = result;

        typeFields.push(fields.replace(replace, `${typeNamePrefix}_`));
        if (typeDefs) {
            nestedTypes.push(typeDefs.replace(replace, `${typeNamePrefix}_`));
        }
    }

    if (!typeFields.length) {
        typeFields.push("_empty: String");
    }

    return {
        fieldType: `${typeNamePrefix}${typeSuffix}`,
        typeDefs: /* GraphQL */ `
            ${nestedTypes.join("\n")}

            ${typeOfType} ${typeNamePrefix}${typeSuffix} {
                ${typeFields.join("\n")}
            }\n
        `
    };
};
