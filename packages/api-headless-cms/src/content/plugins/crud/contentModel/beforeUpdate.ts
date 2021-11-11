import { Topic } from "@webiny/pubsub/types";
import {
    BeforeModelUpdateTopicParams,
    CmsContentModelField,
    CmsModelFieldToGraphQLPlugin,
    CmsModelLockedFieldPlugin,
    HeadlessCmsStorageOperations
} from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { ContentModelPlugin } from "~/content/plugins/ContentModelPlugin";

const defaultTitleFieldId = "id";

const allowedTitleFieldTypes = ["text", "number"];

const getContentModelTitleFieldId = (
    fields: CmsContentModelField[],
    titleFieldId?: string
): string => {
    // if there is no title field defined either in input data or existing content model data
    // we will take first text field that has no multiple values enabled
    // or if initial titleFieldId is the default one also try to find first available text field
    if (!titleFieldId || titleFieldId === defaultTitleFieldId) {
        const titleField = fields.find(field => {
            return field.type === "text" && !field.multipleValues;
        });
        return titleField ? titleField.fieldId : defaultTitleFieldId;
    }
    // check existing titleFieldId for existence in the model
    // for correct type
    // and that it is not multiple values field
    const target = fields.find(f => f.fieldId === titleFieldId);
    if (!target) {
        throw new WebinyError(`Field does not exist in the model.`, "VALIDATION_ERROR", {
            fieldId: titleFieldId
        });
    }

    if (allowedTitleFieldTypes.includes(target.type) === false) {
        throw new WebinyError(
            `Only ${allowedTitleFieldTypes.join(
                ", "
            )} and id fields can be used as an entry title.`,
            "ENTRY_TITLE_FIELD_TYPE",
            {
                fieldId: target.fieldId,
                type: target.type
            }
        );
    }

    if (target.multipleValues) {
        throw new WebinyError(
            `Fields that accept multiple values cannot be used as the entry title.`,
            "ENTRY_TITLE_FIELD_TYPE",
            {
                fieldId: target.fieldId,
                type: target.type
            }
        );
    }

    return target.fieldId;
};

export interface Params {
    onBeforeUpdate: Topic<BeforeModelUpdateTopicParams>;
    storageOperations: HeadlessCmsStorageOperations;
    plugins: PluginsContainer;
}
export const assignBeforeModelUpdate = (params: Params) => {
    const { onBeforeUpdate, plugins } = params;

    onBeforeUpdate.subscribe(async params => {
        const { model } = params;

        const modelPlugin: ContentModelPlugin = plugins
            .byType<ContentModelPlugin>(ContentModelPlugin.type)
            .find((item: ContentModelPlugin) => item.contentModel.modelId === model.modelId);

        if (modelPlugin) {
            throw new WebinyError(
                "Content models defined via plugins cannot be updated.",
                "CONTENT_MODEL_UPDATE_ERROR",
                {
                    modelId: model.modelId
                }
            );
        }

        const { titleFieldId } = model;

        // There should be fields/locked fields in either model or data to be updated.
        const { fields = [], lockedFields = [] } = model;

        // Let's inspect the fields of the received content model. We prevent saving of a content model if it
        // contains a field for which a "cms-model-field-to-graphql" plugin does not exist on the backend.
        const fieldTypePlugins = plugins.byType<CmsModelFieldToGraphQLPlugin>(
            "cms-model-field-to-graphql"
        );

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (!fieldTypePlugins.find(item => item.fieldType === field.type)) {
                throw new Error(
                    `Cannot update content model because of the unknown "${field.type}" field.`
                );
            }
        }

        model.titleFieldId = getContentModelTitleFieldId(fields, titleFieldId);

        const cmsLockedFieldPlugins =
            plugins.byType<CmsModelLockedFieldPlugin>("cms-model-locked-field");

        // We must not allow removal or changes in fields that are already in use in content entries.
        for (const lockedField of lockedFields) {
            const existingField = fields.find(item => item.fieldId === lockedField.fieldId);
            if (!existingField) {
                throw new WebinyError(
                    `Cannot remove the field "${lockedField.fieldId}" because it's already in use in created content.`,
                    "ENTRY_FIELD_USED"
                );
            }

            if (lockedField.multipleValues !== existingField.multipleValues) {
                throw new WebinyError(
                    `Cannot change "multipleValues" for the "${lockedField.fieldId}" field because it's already in use in created content.`,
                    "ENTRY_FIELD_USED"
                );
            }

            if (lockedField.type !== existingField.type) {
                throw new WebinyError(
                    `Cannot change field type for the "${lockedField.fieldId}" field because it's already in use in created content.`,
                    "ENTRY_FIELD_USED"
                );
            }

            // Check `lockedField` invariant for specific field
            const lockedFieldsByType = cmsLockedFieldPlugins.filter(
                pl => pl.fieldType === lockedField.type
            );
            for (const plugin of lockedFieldsByType) {
                if (typeof plugin.checkLockedField !== "function") {
                    continue;
                }
                plugin.checkLockedField({
                    lockedField,
                    field: existingField
                });
            }
        }
    });
};
