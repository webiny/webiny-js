import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import get from "lodash/get";
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/ref");

const extractValue = (value) => {
    if (!value) {
        return "";
    }

    if (Array.isArray(value) && value.filter(Boolean).length) {
        const [first] = value;
        if (typeof first === "string") {
            return first;
        }

        if (first.id) {
            return first.id;
        }
    }

    return "";
}

const AutoCompleteContainer = ({ field, value, onChange }) => {
    const [title, setTitle] = useState("");
    // Initialize value
    useEffect(() => {
        if (Array.isArray(value) && value.length !== 0 && value.some(v => typeof v !== "string")) {
            const onlyIds = value.map(i => i && i.id);
            const [firstId] = onlyIds;
            onChange([firstId]);
        }
    }, [])

    const typeName = upperFirst(field.settings.modelId);

    const LIST_CONTENT_ENTRIES = gql`
                query HeadlessCmsListContentEntries($where: [${typeName}WhereInput], $sort: [${typeName}ListSorter], $after: String, $before: String, $limit: Int) {
                    list${pluralize(typeName)}(where: $where, sort: $sort, after: $after, before: $before, limit: $limit) {
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
        <AutoComplete
            value={extractValue(value)}
            onChange={(value) => {
                onChange([value]);
            }}
            onInput={inputValue => {
                setTitle(inputValue);
            }}
            label={I18NValue({ value: field.label })}
            description={I18NValue({ value: field.helpText })}
            options={contentEntries}
        />
    )
}

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-ref",
    renderer: {
        rendererName: "ref-input",
        name: t`Reference Input`,
        description: t`Renders a simple input with its type set to "text".`,
        canUse({ field }) {
            return field.type === "ref" && !field.multipleValues;
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bind => (
                        <AutoCompleteContainer
                            {...bind}
                            field={field}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
