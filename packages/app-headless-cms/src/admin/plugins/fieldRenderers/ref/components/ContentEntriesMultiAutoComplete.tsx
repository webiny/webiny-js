import React, { useEffect, useState, useMemo } from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import get from "lodash/get";
import debounce from "lodash/debounce";
import { createListQuery, GET_CONTENT_MODEL } from "./graphql";
import { i18n } from "@webiny/app/i18n";
import { Link } from "@webiny/react-router";
const t = i18n.ns("app-headless-cms/admin/fields/ref");

function ContentEntriesMultiAutocomplete({ bind, field }) {
    // Value can be an array of object (received from API) or an array of ID (set by the Autocomplete component).
    const value = bind.value.map(item => {
        return get(item, "id", item);
    });
    const [search, setSearch] = useState("");

    // Format value coming from API
    useEffect(() => {
        if (bind.value.some(v => typeof v !== "string")) {
            // We only need IDs to send back in request to API
            bind.onChange(
                bind.value.map(item => {
                    return get(item, "id", item);
                })
            );
        }
    }, [bind.value]);

    const { getValue } = useI18N();

    // Fetch ref content model data, so that we can its title field.
    const refContentModelQuery = useQuery(GET_CONTENT_MODEL, {
        variables: { where: { modelId: field.settings.modelId } }
    });

    const refContentModel = get(refContentModelQuery, `data.getContentModel.data`, {});

    // Once we have the refContentModel loaded, this will construct proper list and get queries.
    const { LIST_CONTENT } = useMemo(
        () => ({
            LIST_CONTENT: createListQuery(refContentModel)
        }),
        [field.settings.modelId, refContentModel.id]
    );

    // Once the query in the input has changed, this query will be triggered.
    const { titleFieldId } = refContentModel;
    const listContentQuery = useQuery(LIST_CONTENT, {
        skip: !search || !titleFieldId,
        variables: { where: { [`${titleFieldId}_contains`]: search } }
    });

    const listLatestContentQuery = useQuery(LIST_CONTENT, {
        variables: { limit: 10 }
    });

    // Once we have a valid IDs, we load the data.
    const listContentQueryFilterById = useQuery(LIST_CONTENT, {
        skip: !value || !titleFieldId,
        variables: { where: { ["id_in"]: value } }
    });

    // Format options for the Autocomplete component.
    const options = get(listContentQuery, "data.content.data", []).map(item => ({
        id: item.id,
        name: getValue(item.meta.title)
    }));

    // Format default options for the Autocomplete component.
    const defaultOptions = get(listLatestContentQuery, "data.content.data", []).map(item => ({
        id: item.id,
        name: getValue(item.meta.title)
    }));

    // Format value prop for the Autocomplete component.
    const valueForAutoComplete = get(listContentQueryFilterById, "data.content.data", []).map(
        item => ({
            id: item.id,
            published: item.meta.published,
            name: getValue(item.meta.title)
        })
    );

    // Calculate loading prop for the Autocomplete component.
    const loading =
        listContentQuery.loading ||
        refContentModelQuery.loading ||
        listContentQueryFilterById.loading;

    let unpublishedEntriesInfo = valueForAutoComplete.filter(item => item.published === false);
    if (unpublishedEntriesInfo.length) {
        unpublishedEntriesInfo = t`Before publishing the main content entry, make sure to publish the
                            following referenced entries: {entries}`({
            entries: (
                <>
                    {unpublishedEntriesInfo.map(
                        ({ id, name, published }, index) =>
                            !published && (
                                <React.Fragment key={id}>
                                    {index > 0 && ", "}
                                    <Link
                                        to={`/cms/content-models/manage/${refContentModel.modelId}?id=${id}`}
                                    >
                                        {name}
                                    </Link>
                                </React.Fragment>
                            )
                    )}
                </>
            )
        });
    }

    return (
        <MultiAutoComplete
            {...bind}
            onChange={values => {
                // We only need IDs to send back in request to API
                bind.onChange(values.map(item => get(item, "id", item)));
            }}
            loading={loading}
            value={valueForAutoComplete}
            options={search ? options : defaultOptions}
            label={<I18NValue value={field.label} />}
            onInput={debounce(search => setSearch(search), 250)}
            description={
                <>
                    <I18NValue value={field.helpText} />
                    {unpublishedEntriesInfo}
                </>
            }
        />
    );
}

export default ContentEntriesMultiAutocomplete;
