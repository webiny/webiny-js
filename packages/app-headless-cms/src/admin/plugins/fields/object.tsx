import React from "react";
import { ReactComponent as ObjectIcon } from "@webiny/icons/ballot.svg";
import { createFieldsList } from "@webiny/app-headless-cms-common";
import { i18n } from "@webiny/app/i18n/index.js";
import { ObjectFields } from "./object/ObjectFields.js";
import type { CmsModelFieldTypePlugin, CmsModelField } from "~/types.js";
import { createTypeName } from "~/utils/createTypeName.js";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-object",
    field: {
        type: "object",
        label: t`Object`,
        description: t`Store nested data structures.`,
        icon: <ObjectIcon />,
        allowList: true,
        allowPredefinedValues: false,
        listLabel: t`Use as a repeatable object`,
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
            queryField({ field, model, graphQLTypePrefix }) {
                const typePrefix = `${graphQLTypePrefix}_${createTypeName(field.fieldId)}`;
                const fields = (
                    field.settings ? (field.settings.fields ?? []) : []
                ) as CmsModelField[];
                return `{ ${createFieldsList({ model, fields, graphQLTypePrefix: typePrefix })} }`;
            }
        }
    }
};

export default plugin;
