import React from "react";
import debounce from "lodash/debounce";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { i18n } from "@webiny/app/i18n";
import { Link } from "@webiny/react-router";
import { useReference } from "./useReference";
import { renderItem } from "./renderItem";
import { createEntryUrl } from "./createEntryUrl";
import { CmsEditorField } from "~/types";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const unpublishedLabel = t`Selected content entry is not published. Make sure to {publishItLink} before publishing the main content entry.`;
const publishedLabel = t`Selected content entry is published. You can view it {here}.`;

interface ContentEntriesAutocompleteProps {
    bind: any;
    field: CmsEditorField;
}
const ContentEntriesAutocomplete: React.FC<ContentEntriesAutocompleteProps> = ({ bind, field }) => {
    const { options, setSearch, value, loading, onChange } = useReference({
        bind,
        field
    });

    let entryInfo: string = null;
    if (value && !value.published) {
        const link = createEntryUrl(value);
        entryInfo = unpublishedLabel({ publishItLink: <Link to={link}>{t`publish it`}</Link> });
    } else if (value) {
        const link = createEntryUrl(value);
        entryInfo = publishedLabel({
            here: <Link to={link}>{t`here`}</Link>
        });
    }

    return (
        <AutoComplete
            {...bind}
            renderItem={renderItem}
            onChange={onChange}
            loading={loading}
            value={value ? value.id : null}
            options={options}
            label={field.label}
            description={
                <>
                    {field.helpText}
                    {entryInfo}
                </>
            }
            onInput={debounce(search => setSearch(search), 250)}
        />
    );
};

export default ContentEntriesAutocomplete;
