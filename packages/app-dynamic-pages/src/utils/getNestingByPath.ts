import ApolloClient from "apollo-client";
import { GET_CONTENT_MODEL } from "@webiny/app-headless-cms/admin/viewsGraphql";
import { plugins } from "@webiny/plugins";
import {
    CmsModelFieldTypePlugin,
    CmsModelField,
    CmsDynamicZoneTemplate
} from "@webiny/app-headless-cms/types";

const resolveFieldPlugin = (type: string) => {
    const fieldPlugins = plugins.byType<CmsModelFieldTypePlugin>("cms-editor-field-type");
    return fieldPlugins.find(plugin => plugin.field.type === type);
};

export type NestingItem = {
    name?: string;
    fields?: CmsModelField[];
    selectedField?: CmsModelField;
    templates?: CmsDynamicZoneTemplate[];
    selectedTemplate?: CmsDynamicZoneTemplate;
    pathPart?: string;
};

export const getNestingByPath = async (
    client: ApolloClient<any>,
    modelId: string,
    path: string
) => {
    const { data } = await client.query({ query: GET_CONTENT_MODEL, variables: { modelId } });
    const model = data.getContentModel.data;
    const nesting: NestingItem[] = [
        {
            name: model.name,
            fields: model.fields
        }
    ];

    if (!path) {
        return nesting;
    }

    for (const pathPart of path.split(".")) {
        if (nesting[nesting.length - 1]?.templates) {
            const currentTemplate = nesting[nesting.length - 1]?.templates?.find(
                (template: CmsDynamicZoneTemplate) => template.gqlTypeName === pathPart
            );

            if (!currentTemplate) {
                throw Error(
                    `${
                        nesting[nesting.length - 1].name
                    } has no template with gqlTypeName ${pathPart}`
                );
            }

            nesting[nesting.length - 1].selectedTemplate = currentTemplate;
            nesting[nesting.length - 1].pathPart = pathPart;

            const nestedFieldPlugin = resolveFieldPlugin("dynamicZone");

            if (nestedFieldPlugin?.field?.getChildFields) {
                const nestedFields = await nestedFieldPlugin.field.getChildFields(
                    client,
                    nesting[nesting.length - 2].selectedField as CmsModelField,
                    currentTemplate.gqlTypeName
                );

                nesting.push({
                    name: currentTemplate.name,
                    fields: nestedFields
                });
            }
        } else {
            const currentField = nesting[nesting.length - 1]?.fields?.find(
                (field: CmsModelField) => field.fieldId === pathPart
            );

            if (!currentField) {
                throw Error(`${nesting[nesting.length - 1].name} has no field with id ${pathPart}`);
            }

            nesting[nesting.length - 1].selectedField = currentField;
            nesting[nesting.length - 1].pathPart = pathPart;

            if (currentField.type === "dynamicZone") {
                nesting.push({
                    name: currentField.fieldId,
                    templates: currentField.settings?.templates
                });
            } else {
                const nestedFieldPlugin = resolveFieldPlugin(currentField.type);

                if (nestedFieldPlugin?.field?.getChildFields) {
                    const nestedFields = await nestedFieldPlugin.field.getChildFields(
                        client,
                        currentField
                    );

                    nesting.push({
                        name: currentField.label,
                        fields: nestedFields
                    });
                }
            }
        }
    }

    return nesting;
};
