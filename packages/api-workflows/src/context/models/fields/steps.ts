import { createIdField } from "./id.js";
import { createTitleField } from "./title.js";
import { createColorField } from "./color.js";
import { createDescriptionField } from "./description.js";
import { createTeamsField } from "./teams.js";
import { createNotificationsField } from "./notifications.js";
import type { CmsModelObjectField } from "@webiny/api-headless-cms/types/index.js";

export const createStepsField = (params?: Partial<CmsModelObjectField>): CmsModelObjectField => {
    return {
        id: "steps",
        type: "object",
        storageId: "object@steps",
        fieldId: "steps",
        label: "Steps",
        multipleValues: true,
        listValidation: [
            {
                name: "required",
                message: "Steps are required."
            },
            {
                name: "minLength",
                settings: {
                    value: 1
                },
                message: "At least one step is required."
            }
        ],
        ...params,
        settings: {
            ...params?.settings,
            fields: [
                createIdField(),
                createTitleField(),
                createColorField(),
                createDescriptionField(),
                createTeamsField(),
                createNotificationsField(),
                ...(params?.settings?.fields || [])
            ]
        }
    };
};
