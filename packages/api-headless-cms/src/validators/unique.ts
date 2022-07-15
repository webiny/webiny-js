import WebinyError from "@webiny/error";
import { CmsModelFieldValidatorPlugin } from "~/types";

/**
 * Validation if the field value is unique.
 * Be aware of using this in DynamoDB only environment as all records will be loaded to check for the unique value.
 */
export const createUniqueValidator = (): CmsModelFieldValidatorPlugin => {
    return {
        type: "cms-model-field-validator",
        name: "cms-model-field-validator-unique",
        validator: {
            name: "unique",
            validate: async ({ field, value: initialValue, context, model, entry }) => {
                const manager = await context.cms.getModelManager(model);
                /**
                 * If there is no value passed, we are assuming that user does not want any value to be validated.
                 * If user needs something to passed into a unique field, they must add "required" validator.
                 */
                const value = (initialValue || "").trim();
                if (!value) {
                    return true;
                }
                try {
                    const [items] = await manager.listLatest({
                        where: {
                            entryId_not: entry ? entry.entryId : undefined,
                            [field.fieldId]: value
                        },
                        limit: 1
                    });
                    return items.length === 0;
                } catch (ex) {
                    throw new WebinyError(
                        "Error while checking if the field value is unique.",
                        "UNIQUE_CHECK_ERROR",
                        {
                            field,
                            value,
                            model
                        }
                    );
                }
            }
        }
    };
};
