import React from "react";
import { ReactComponent as ObjectIcon } from "@material-design-icons/svg/outlined/dynamic_form.svg";
import { i18n } from "@webiny/app/i18n";
import { createFieldsList } from "@webiny/app-headless-cms-common";
import { DynamicZone } from "~/admin/plugins/fields/dynamicZone/DynamicZone";
import { createTypeName } from "~/utils/createTypeName";
import { CmsModelFieldTypePlugin, CmsModelFieldValidatorsGroup } from "~/types";
import { commonValidators } from "./dynamicZone/commonValidators";

const t = i18n.ns("app-headless-cms/admin/fields");

const listValidators: CmsModelFieldValidatorsGroup = {
    validators: commonValidators,
    title: "List validators",
    description: "These validators are applied to the entire dynamic zone."
};

export const dynamicZoneField: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-dynamic-zone",
    field: {
        type: "dynamicZone",
        label: t`Dynamic Zone`,
        description: t`Define content templates to be used during content creation.`,
        icon: <ObjectIcon />,
        allowMultipleValues: true,
        allowPredefinedValues: false,
        validators: field => {
            if (field.multipleValues) {
                return {
                    validators: ["dynamicZone"],
                    title: "Template Validators",
                    description: "Validators for each of the templates in this dynamic zone."
                };
            }

            return ["required"];
        },
        listValidators,
        multipleValuesLabel: t`Use as a list of values`,
        createField() {
            return {
                type: this.type,
                listValidation: [{ name: "dynamicZone" }],
                settings: {
                    templates: []
                },
                renderer: {
                    name: "dynamicZone"
                }
            };
        },
        render() {
            return <DynamicZone />;
        },
        graphql: {
            queryField({ model, field, graphQLTypePrefix }) {
                const prefix = `${graphQLTypePrefix}_${createTypeName(field.fieldId)}`;
                const templates = field.settings?.templates || [];

                if (!templates.length) {
                    return null;
                }

                const fragments = templates.map(template => {
                    const templateGraphQLType = `${prefix}_${template.gqlTypeName}`;
                    return `...on ${templateGraphQLType} {
                        ${createFieldsList({
                            model,
                            fields: template.fields || [],
                            graphQLTypePrefix: templateGraphQLType
                        })}
                        _templateId
                        __typename
                    }`;
                });
                return `{ ${fragments.join("\n")} }`;
            }
        },
        async getChildFields(_, field, gqlTypeName) {
            return (
                field.settings?.templates?.find(template => template.gqlTypeName === gqlTypeName)
                    ?.fields || []
            );
        }
    }
};
