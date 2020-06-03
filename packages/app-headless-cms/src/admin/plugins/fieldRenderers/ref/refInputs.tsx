import React, { useState, useEffect, useCallback, useMemo } from "react";
import gql from "graphql-tag";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { CircularProgress } from "@webiny/ui/Progress";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import get from "lodash/get";
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";
import debounce from "lodash/debounce";
import { extractIdsFromValue, GET_CONTENT_MODEL } from "./utils";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/ref");

const MultiAutoCompleteContainer = ({ field, value, onChange, titleFieldId }) => {
    const [title, setTitle] = useState([]);
    // Initialize values
    useEffect(() => {
        if (Array.isArray(value) && value.length !== 0) {
            const onlyIds = value.map(i => i.id);
            onChange(onlyIds);
        }
    }, [])

    // Reset title
    useEffect(() => {
        if (Array.isArray(value) && value.length !== 0) {
            const titles = [];
            value.forEach(v => {
                if (v && v.meta && v.meta.title.value) {
                    titles.push(v.meta.title.value);
                }
            })
            if (titles.length) {
                setTitle(titles);
            }
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

    const { data } = useQuery(LIST_CONTENT_ENTRIES, { variables: { where: { [`${titleFieldId}_in`]: title } } });

    const contentEntries = get(data, `list${pluralize(typeName)}.data`, []).map(item => {
        return { id: item.id, name: item.meta.title.value };
    });

    const handleOnInput = useCallback(inputValue => {
        if (inputValue.length) {
            setTitle([...title, inputValue]);
        }
    }, []);

    const debounceOnInput = useMemo(() => debounce(handleOnInput, 250), []);

    const label = I18NValue({ value: field.label });
    const description = I18NValue({ value: field.helpText });

    return (
        <MultiAutoComplete
            value={extractIdsFromValue(value, contentEntries)}
            onChange={(value) => {
                onChange(value.map(item => item.id));
            }}
            onInput={debounceOnInput}
            options={contentEntries}
            label={label}
            description={description}
        />
    );
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

            const { data, loading } = useQuery(GET_CONTENT_MODEL, { variables: { where: { modelId: field.settings.modelId } } });

            if (loading) {
                return <CircularProgress />;
            }

            const { titleFieldId } = get(data, `getContentModel.data`, {});

            return (
                <Bind>
                    {bind => (
                        <MultiAutoCompleteContainer
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
