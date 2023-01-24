import { CmsModelCreateInput, CmsModelFieldInput } from "~/types";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";

const createDefaultFields = (): CmsModelFieldInput[] => {
    return [
        {
            id: generateAlphaNumericLowerCaseId(8),
            fieldId: "title",
            type: "text",
            label: "Title",
            validation: [
                {
                    name: "required",
                    message: "Title is a required field."
                }
            ],
            listValidation: [],
            renderer: {
                name: "text-input"
            }
        },
        {
            id: generateAlphaNumericLowerCaseId(8),
            fieldId: "description",
            type: "long-text",
            label: "Description",
            validation: [],
            listValidation: [],
            renderer: {
                name: "long-text-text-area"
            }
        },
        {
            id: generateAlphaNumericLowerCaseId(8),
            fieldId: "image",
            type: "file",
            label: "Image",
            validation: [],
            listValidation: [],
            renderer: {
                name: "file-input"
            },
            settings: {
                imagesOnly: true
            }
        }
    ];
};

/**
 * We only assign default fields if there are no fields in the model already.
 */
export const assignModelDefaultFields = (model: CmsModelCreateInput): void => {
    if (model.fields && model.fields.length !== 0) {
        return;
    }

    model.fields = createDefaultFields();
    model.layout = [[model.fields[0].id], [model.fields[1].id, model.fields[2].id]];
};
