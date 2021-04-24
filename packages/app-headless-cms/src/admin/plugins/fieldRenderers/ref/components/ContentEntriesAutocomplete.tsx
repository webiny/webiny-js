import React from "react";
import debounce from "lodash/debounce";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { i18n } from "@webiny/app/i18n";
import { Link } from "@webiny/react-router";
import { useReference } from "./useReference";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const label = t`Selected content entry is not published. Make sure to {publishItLink} before publishing the main content entry.`;

function ContentEntriesAutocomplete({ bind, field }) {
    const { options, setSearch, value, loading, onChange } = useReference({
        bind,
        field
    });

    let unpublishedEntryInfo = null;
    if (value && !value.published) {
        const link = `/cms/content-entries/${value.modelId}?id=${encodeURIComponent(value.id)}`;
        unpublishedEntryInfo = label({ publishItLink: <Link to={link}>{t`publish it`}</Link> });
    }

    return (
        <AutoComplete
            {...bind}
            onChange={onChange}
            loading={loading}
            value={value ? value.id : null}
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
