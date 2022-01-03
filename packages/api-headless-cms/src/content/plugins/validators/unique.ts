import WebinyError from "@webiny/error";
import { CmsModelFieldValidatorPlugin } from "~/types";

/**
 * Validation if the field value is unique.
 * Be aware of using this in DynamoDB only environment as all records will be loaded to check for the unique value.
 */
export default (): CmsModelFieldValidatorPlugin => {
    return {
        type: "cms-model-field-validator",
        name: "cms-model-field-validator-unique",
        validator: {
            name: "unique",
            validate: async ({ field, value, context, model, entry }) => {
                const manager = await context.cms.getModelManager(model);

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
