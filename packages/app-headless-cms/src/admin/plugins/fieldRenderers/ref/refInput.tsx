import React, { useState, useEffect, useMemo, useCallback } from "react";
import gql from "graphql-tag";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { CircularProgress } from "@webiny/ui/Progress";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import get from "lodash/get";
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";
import debounce from "lodash/debounce";
import { extractIdStringFromValue, GET_CONTENT_MODEL } from "./utils";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/ref");

const AutoCompleteContainer = ({ field, value, onChange, titleFieldId }) => {
    const [title, setTitle] = useState(null);
    // Initialize value
    useEffect(() => {
        if (Array.isArray(value) && value.length !== 0) {
            const onlyIds = value.map(i => i && i.id);
            const [firstId] = onlyIds;
            onChange([firstId]);
        }
    }, []);

    // Reset title
    useEffect(() => {
        if (Array.isArray(value) && value.length !== 0) {
            value.forEach(v => {
                if (v && v.meta && v.meta.title.value) {
                    setTitle(v.meta.title.value);
                }
            })
        }
    }, [value])

    const typeName = upperFirst(field.settings.modelId);

    const LIST_CONTENT_ENTRIES = gql`
        query HeadlessCmsListContentEntries($where: ${typeName}ListWhereInput, $sort: [${typeName}ListSorter], $after: String, $before: String, $limit: Int) {
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

    const { data } = useQuery(LIST_CONTENT_ENTRIES, { variables: { where: { [`${titleFieldId}_contains`]: title } } });

    const contentEntries = get(data, `list${pluralize(typeName)}.data`, []).map(item => {
        return { id: item.id, name: item.meta.title.value };
    });

    const handleOnInput = useCallback(inputValue => {
        setTitle(inputValue);
    }, []);

    const debounceOnInput = useMemo(() => debounce(handleOnInput, 250), []);

    const label = I18NValue({ value: field.label });
    const description = I18NValue({ value: field.helpText });

    return (
        <AutoComplete
            value={extractIdStringFromValue(value)}
            onChange={(value) => {
                onChange([value]);
            }}
            onInput={debounceOnInput}
            label={label}
            description={description}
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

            const { data, loading } = useQuery(GET_CONTENT_MODEL, { variables: { where: { modelId: field.settings.modelId } } });

            if (loading) {
                return <CircularProgress />;
            }

            const { titleFieldId } = get(data, `getContentModel.data`, {});

            return (
                <Bind>
                    {bind => (
                        <AutoCompleteContainer
                            {...bind}
                            field={field}
                            titleFieldId={titleFieldId}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
