import React from "react";
import gql from "graphql-tag";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import get from "lodash/get";
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const extractValue = (values, list) => {
    if (!values) {
        return [];
    }
    const IDs = values.map(value => {
        if (typeof value === "string") {
            return value;
        }
        if (value.id) {
            return value.id;
        }
        return "";
    }).filter(Boolean);

    return list.filter(item => IDs.some(id => id === item.id));
}

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-ref-inputs",
    renderer: {
        rendererName: "ref-inputs",
        name: t`Reference Inputs`,
        description: t`Renders a simple list of text inputs.`,
        canUse({ field }) {
            return field.type === "ref" && field.multipleValues;
        },
        render({ field, getBind }) {
            const Bind = getBind();
            const typeName = upperFirst(field.settings.modelId);

            const LIST_CONTENT_ENTRIES = gql`
                query HeadlessCmsListContentEntries($sort: [${typeName}ListSorter], $after: String, $before: String, $limit: Int) {
                    list${pluralize(typeName)}(sort: $sort, after: $after, before: $before, limit: $limit) {
                        data {
                            id
                            meta {
                                model
                                title {
                                    value
                                }
                            }
                        }
                    }
                }
            `;

            const { data } = useQuery(LIST_CONTENT_ENTRIES);

            const contentEntries = get(data, `list${pluralize(typeName)}.data`, []).map(item => {
                return { id: item.id, name: item.meta.title.value };
            });

            return (
                <Bind>
                    {({ value, onChange }) => (
                        <MultiAutoComplete
                            value={extractValue(value, contentEntries)}
                            onChange={(value) => {
                                onChange(value.map(item => item.id));
                            }}
                            label={I18NValue({ value: field.label })}
                            description={I18NValue({ value: field.helpText })}
                            options={contentEntries}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
