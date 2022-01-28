import React, { useCallback } from "react";
import debounce from "lodash/debounce";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { Link } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { ReferencedCmsEntry, useReferences } from "./useReferences";
import { renderItem } from "./renderItem";
import NewRefEntryFormDialog, { NewEntryButton } from "./NewRefEntryFormDialog";
import { useNewRefEntry } from "../hooks/useNewRefEntry";
import { CmsEditorField } from "~/types";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const warn = t`Before publishing the main content entry, make sure you publish the following referenced entries: {entries}`;

interface ContentEntriesMultiAutocompleteProps {
    bind: any;
    field: CmsEditorField;
}
const ContentEntriesMultiAutocomplete: React.FC<ContentEntriesMultiAutocompleteProps> = ({
    bind,
    field
}) => {
    const { options, setSearch, entries, loading, onChange } = useReferences({ bind, field });

    const { renderNewEntryModal, refModelId, helpText } = useNewRefEntry({ field });

    const entryWarning = (entry: ReferencedCmsEntry, index: number) => {
        const { id, modelId, name, published } = entry;
        if (published) {
            return null;
        }
        return (
            <React.Fragment key={id}>
                {index > 0 && ", "}
                <Link to={`/cms/content-entries/${modelId}?id=${encodeURIComponent(id)}`}>
                    {name}
                </Link>
            </React.Fragment>
        );
    };

    let warning = entries.filter(item => item.published === false);
    if (warning.length) {
        warning = warn({
            entries: <>{warning.map(entryWarning)}</>
        });
    }

    const refEntryOnChange = useCallback(
        value => {
            /**
             * Append new selected entry at the end of existing entries.
             */
            onChange([...entries, value]);
        },
        [onChange, entries]
    );

    if (renderNewEntryModal) {
        return (
            <NewRefEntryFormDialog modelId={refModelId} onChange={refEntryOnChange}>
                <MultiAutoComplete
                    {...bind}
                    renderItem={renderItem}
                    renderListItemLabel={renderItem}
                    useMultipleSelectionList
                    onChange={onChange}
                    loading={loading}
                    value={entries}
                    options={options}
                    label={field.label}
                    onInput={debounce(setSearch, 250)}
                    description={
                        <>
                            {field.helpText}
                            {warning}
                        </>
                    }
                    noResultFound={<NewEntryButton />}
                />
            </NewRefEntryFormDialog>
        );
    }

    return (
        <MultiAutoComplete
            {...bind}
            renderItem={renderItem}
            renderListItemLabel={renderItem}
            useMultipleSelectionList
            onChange={onChange}
            loading={loading}
            value={entries}
            options={options}
            label={field.label}
            onInput={debounce(setSearch, 250)}
            description={
                <>
                    {field.helpText}
                    {warning}
                </>
            }
            noResultFound={helpText}
        />
    );
};

export default ContentEntriesMultiAutocomplete;
