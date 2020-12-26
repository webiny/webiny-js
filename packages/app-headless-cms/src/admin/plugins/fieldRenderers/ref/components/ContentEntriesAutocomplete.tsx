import React from "react";
import debounce from "lodash/debounce";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { i18n } from "@webiny/app/i18n";
import { Link } from "@webiny/react-router";
import { useSingleRef } from "./useSingleRef";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

function ContentEntriesAutocomplete({ bind, field }) {
    const { options, setSearch, value, loading } = useSingleRef({ bind, field });

    // Currently we only support 1 model in the `ref` field, so we use index 0 (this will be upgraded in the future).
    const { modelId } = field.settings.models[0];

    const unpublishedEntryInfo =
        value.published &&
        t`Selected content entry is not published. Make sure to {publishItLink} before publishing the main content entry.`(
            {
                publishItLink: (
                    <Link
                        to={`/cms/content-entries/${modelId}?id=${value.id}`}
                    >{t`publish it`}</Link>
                )
            }
        );

    return (
        <AutoComplete
            {...bind}
            onChange={value => {
                if (value !== null) {
                    return bind.onChange({ modelId, entryId: value });
                }
                bind.onChange(null);
            }}
            loading={loading}
            value={value.id}
            options={options}
            label={field.label}
            description={
                <>
                    {field.helpText}
                    {unpublishedEntryInfo}
                </>
            }
            onInput={debounce(search => setSearch(search), 250)}
        />
    );
}

export default ContentEntriesAutocomplete;
