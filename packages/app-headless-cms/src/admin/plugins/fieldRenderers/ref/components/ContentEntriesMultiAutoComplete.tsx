import React, { useState, useMemo } from "react";
import { I18NValue } from "@webiny/app-i18n/components";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import get from "lodash/get";
import debounce from "lodash/debounce";
import { createListQuery, GET_CONTENT_MODEL } from "./graphql";
import { i18n } from "@webiny/app/i18n";
import { Link } from "@webiny/react-router";
import { useI18NHelpers } from "./refInputUtils";
const t = i18n.ns("app-headless-cms/admin/fields/ref");

function ContentEntriesMultiAutocomplete({ bind, field, locale }) {
    // Value can be an array of object (received from API) or an array of ID (set by the Autocomplete component).
    const value = bind.value.map(item => {
        return get(item, "id", item);
    });
    const [search, setSearch] = useState("");

    const { getAutoCompleteOptionsFromList } = useI18NHelpers();

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

    // Once we have a valid IDs, we load the data.
    const listContentQueryFilterById = useQuery(LIST_CONTENT, {
        skip: !value || !titleFieldId,
        variables: { where: { ["id_in"]: value } }
    });

    const listLatestContentQuery = useQuery(LIST_CONTENT, {
        variables: { limit: 10 }
    });

    // Format options for the Autocomplete component.
    const options = useMemo(
        () =>
            getAutoCompleteOptionsFromList({
                list: listContentQuery,
                useDefaultLocale: false,
                locale
            }),
        [listContentQuery]
    );

    // Format default options for the Autocomplete component.
    const defaultOptions = useMemo(
        () =>
            getAutoCompleteOptionsFromList({
                list: listLatestContentQuery,
                useDefaultLocale: true,
                locale
            }),
        [listLatestContentQuery]
    );

    // Format value prop for the Autocomplete component.
    const valueForAutoComplete = useMemo(
        () =>
            getAutoCompleteOptionsFromList({
                list: listContentQueryFilterById,
                useDefaultLocale: true,
                locale,
                keyValueExtractor: item => ({ published: item.meta.published })
            }),
        [listContentQueryFilterById]
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
