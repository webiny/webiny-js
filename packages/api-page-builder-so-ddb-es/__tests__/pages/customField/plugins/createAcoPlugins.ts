import {
    createAppModifier,
    PageBuilderAcoModifyCreatePayloadPlugin,
    PageBuilderAcoModifyUpdatePayloadPlugin
} from "@webiny/api-page-builder-aco";
import {
    CustomFieldsPage,
    CustomFieldsPbCreatePayload,
    CustomFieldsPbUpdatePayload
} from "~tests/types";

/**
 * These plugins transfer the customViews data from the page to the ACO payload, in both create and update scenarios.
 */
export const createAcoPlugins = () => {
    return [
        createAppModifier(({ addField }) => {
            addField({
                id: "customViews",
                fieldId: "customViews",
                storageId: "number@customViews",
                type: "number",
                label: "Custom Views"
            });
        }),
        new PageBuilderAcoModifyCreatePayloadPlugin<CustomFieldsPbCreatePayload, CustomFieldsPage>(
            async ({ payload, page }) => {
                payload.data.customViews = page.settings.customViews;
            }
        ),
        new PageBuilderAcoModifyUpdatePayloadPlugin<CustomFieldsPbUpdatePayload, CustomFieldsPage>(
            async ({ payload, page }) => {
                payload.data.customViews = page.settings.customViews;
            }
        )
    ];
};
