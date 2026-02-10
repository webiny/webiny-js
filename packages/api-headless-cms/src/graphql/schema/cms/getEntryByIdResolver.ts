import type { CmsContext } from "~/types/index.js";
import { getModel, getErrorMessage, buildFieldsSelection } from "./helpers.js";

export interface GetEntryByIdArgs {
    modelId: string;
    id: string;
    fields?: string[];
}

export const createGetEntryByIdResolver = () => {
    return async ({ args, context }: { args: GetEntryByIdArgs; context: CmsContext }) => {
        const { modelId, id, fields } = args;

        try {
            const model = await getModel(context, modelId);

            const fieldsSelection = buildFieldsSelection(fields);

            // Use the getEntryById method from contentEntry.crud.ts
            const entry = await context.cms.getEntryById(model, id);

            if (!entry) {
                return { data: null, error: null };
            }

            // If fields are specified, filter the entry data to include only those fields
            if (fields && fields.length > 0) {
                const filteredData: Record<string, unknown> = {};
                
                for (const field of fields) {
                    if (field.startsWith("values.")) {
                        const valuePath = field.substring(7); // Remove "values." prefix
                        if (!filteredData.values) {
                            filteredData.values = {};
                        }
                        const pathParts = valuePath.split(".");
                        let source = entry.values || {};
                        let target = filteredData.values as Record<string, unknown>;
                        
                        for (let i = 0; i < pathParts.length - 1; i++) {
                            const part = pathParts[i];
                            source = (source as Record<string, unknown>)[part] as Record<string, unknown>;
                            if (!target[part]) {
                                target[part] = {};
                            }
                            target = target[part] as Record<string, unknown>;
                        }
                        const lastPart = pathParts[pathParts.length - 1];
                        target[lastPart] = (source as Record<string, unknown>)[lastPart];
                    } else {
                        // Top-level field
                        filteredData[field] = (entry as Record<string, unknown>)[field];
                    }
                }
                
                return { data: filteredData, error: null };
            }

            return { data: entry, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: getErrorMessage(error, "Failed to get entry by ID"),
                    code: "GET_ENTRY_BY_ID_ERROR"
                }
            };
        }
    };
};
