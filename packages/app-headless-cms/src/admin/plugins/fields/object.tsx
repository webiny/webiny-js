import React from "react";
import { ReactComponent as ObjectIcon } from "@material-design-icons/svg/outlined/ballot.svg";
import { CmsModelFieldTypePlugin, CmsModelField } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { ObjectFields } from "./object/ObjectFields";
import { createFieldsList } from "~/admin/graphql/createFieldsList";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-object",
    field: {
        type: "object",
        label: t`Object`,
        description: t`Store nested data structures.`,
        icon: <ObjectIcon />,
        allowMultipleValues: true,
        allowPredefinedValues: false,
        multipleValuesLabel: t`Use as a repeatable object`,
        createField() {
            return {
                type: this.type,
                validation: [],
                settings: {
                    fields: [],
                    layout: []
                },
                renderer: {
                    name: ""
                }
            };
        },
        render(props) {
            return <ObjectFields {...props} />;
        },
        graphql: {
            queryField({ field, model }) {
                const fields = (field.settings ? field.settings.fields : []) as CmsModelField[];
                return `{ ${createFieldsList({ model, fields })} }`;
            }
        }
    }
};

export default plugin;
