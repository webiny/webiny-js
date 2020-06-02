import React from "react";
import gql from "graphql-tag";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { css } from "emotion";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import get from "lodash/get";
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/ref");

const selectStyles = css({
    color: 'red',
    '& label': {
        top: '8px !important',
        transform: 'translateY(-15%) scale(0.75) !important'
    }
});

const extractValue = (value) => {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (value.id) {
        return value.id;
    }
}

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-ref",
    renderer: {
        rendererName: "ref-input",
        name: t`Reference Input`,
        description: t`Renders a simple input with its type set to "text".`,
        canUse({ field }) {
            return field.type === "ref" && !field.multipleValues && !field.predefinedValues;
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
                    {bind => (
                        <AutoComplete
                            {...bind}
                            value={extractValue(bind.value)}
                            onChange={(value) => {
                                bind.onChange(value);
                            }}
                            label={I18NValue({ value: field.label })}
                            description={I18NValue({ value: field.helpText })}
                            className={selectStyles}
                            options={contentEntries}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
