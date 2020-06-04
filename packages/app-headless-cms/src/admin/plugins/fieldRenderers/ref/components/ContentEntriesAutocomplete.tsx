import React, { useState, useMemo } from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import get from "lodash/get";
import debounce from "lodash/debounce";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { I18NValue } from "@webiny/app-i18n/components";
import { createListQuery, createGetQuery, GET_CONTENT_MODEL } from "./graphql";
import { i18n } from "@webiny/app/i18n";
import { Link } from "@webiny/react-router";
const t = i18n.ns("app-headless-cms/admin/fields/ref");

function ContentEntriesAutocomplete({ bind, field }) {
    // Value can be an object (received from API) or an ID (set by the Autocomplete component).
    const value = get(bind, "value.id", bind.value);
    const [search, setSearch] = useState("");
    const { getValue } = useI18N();

    // Fetch ref content model data, so that we can its title field.
    const refContentModelQuery = useQuery(GET_CONTENT_MODEL, {
        variables: { where: { modelId: field.settings.modelId } }
    });

    const refContentModel = get(refContentModelQuery, `data.getContentModel.data`, {});

    // Once we have the refContentModel loaded, this will construct proper list and get queries.
    const { LIST_CONTENT, GET_CONTENT } = useMemo(
        () => ({
            LIST_CONTENT: createListQuery(refContentModel),
            GET_CONTENT: createGetQuery(refContentModel)
        }),
        [field.settings.modelId, refContentModel.id]
    );

    // Once the query in the input has changed, this query will be triggered.
    const { titleFieldId } = refContentModel;
    const listContentQuery = useQuery(LIST_CONTENT, {
        skip: !search || !titleFieldId,
        variables: { where: { [`${titleFieldId}_contains`]: search } }
    });

    // Once we have a valid ID, we load the data.
    const getContentQuery = useQuery(GET_CONTENT, {
        skip: !value || !titleFieldId,
        variables: { where: { id: value } }
    });

    // Format options for the Autocomplete component.
    const options = get(listContentQuery, "data.content.data", []).map(item => ({
        id: item.id,
        name: getValue(item.meta.title)
    }));

    // Calculate a couple of props for the Autocomplete component.
    const id = get(getContentQuery, "data.content.data.id");
    const published = get(getContentQuery, "data.content.data.meta.published");
    const name = getValue(get(getContentQuery, "data.content.data.meta.title"));
    const loading =
        listContentQuery.loading || refContentModelQuery.loading || getContentQuery.loading;

    const unpublishedEntryInfo =
        published === false &&
        t`Selected content entry is not published. Make sure to {publishItLink} before publishing the main content entry.`(
            {
                publishItLink: (
                    <Link
                        to={`/cms/content-models/manage/${refContentModel.modelId}?id=${id}`}
                    >{t`publish it`}</Link>
                )
            }
        );

    return (
        <AutoComplete
            {...bind}
            loading={loading}
            value={{ id, name }}
            options={options}
            label={<I18NValue value={field.label} />}
            description={
                <>
                    <I18NValue value={field.helpText} />
                    {unpublishedEntryInfo}
                </>
            }
            onInput={debounce(search => search && setSearch(search), 250)}
        />
    );
}

export default ContentEntriesAutocomplete;
