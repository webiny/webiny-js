import React from "react";
import { ReactComponent as ObjectIcon } from "@material-design-icons/svg/outlined/dynamic_form.svg";
import { CmsEditorFieldTypePlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { DynamicZone } from "~/admin/plugins/fields/dynamicZone/DynamicZone";
// import {createFieldsList} from "~/admin/graphql/createFieldsList";

const t = i18n.ns("app-headless-cms/admin/fields");

export const dynamicZoneField: CmsEditorFieldTypePlugin = {
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
        listValidators: {
            validators: ["minLength", "maxLength"],
            title: "List validators",
            description: "These validators are applied to the entire dynamic zone."
        },
        canAccept(_, draggable) {
            return draggable.fieldType !== "dynamicZone";
        },
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
        }
        // graphql: {
        //     queryField({ field }) {
        //         return `{ ${createFieldsList(
        //             (field.settings ? field.settings.fields : []) || []
        //         )} }`;
        //     }
        // }
    }
};
