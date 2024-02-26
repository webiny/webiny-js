import React, { useCallback, useState } from "react";
import debounce from "lodash/debounce";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { Link } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { useReferences } from "./useReferences";
import { renderItem, renderListItemOptions } from "./renderItem";
import { NewEntryButton } from "./NewEntryButton";
import { useNewRefEntry } from "../hooks/useNewRefEntry";
import { CmsModelField } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";
import { OptionItem } from "./types";
import { useModels } from "~/admin/hooks";
import { NewReferencedEntryDialog } from "~/admin/plugins/fieldRenderers/ref/components/NewReferencedEntryDialog";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const warn = t`Before publishing the main content entry, make sure you publish the following referenced entries: {entries}`;

interface ContentEntriesMultiAutocompleteProps {
    bind: BindComponentRenderProp;
    field: CmsModelField;
}
const ContentEntriesMultiAutocomplete = ({ bind, field }: ContentEntriesMultiAutocompleteProps) => {
    const { models } = useModels();
    const [showNewEntryModal, setShowNewEntryModal] = useState(false);
    const { options, setSearch, entries, loading, onChange } = useReferences({ bind, field });

    const { renderNewEntryModal, refModelId, helpText } = useNewRefEntry({ field });

    const entryWarning = (entry: OptionItem, index: number): React.ReactElement | null => {
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

    let warning = entries.filter(item => !item.published);
    if (warning.length > 0) {
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
            setShowNewEntryModal(false);
        },
        [onChange, entries]
    );

    const model = models.find(model => model.modelId === refModelId);

    if (renderNewEntryModal) {
        return (
            <>
                {showNewEntryModal && model ? (
                    <NewReferencedEntryDialog
                        onClose={() => setShowNewEntryModal(false)}
                        model={model}
                        onChange={refEntryOnChange}
                    />
                ) : null}
                <MultiAutoComplete
                    {...bind}
                    renderItem={renderItem}
                    renderListItemLabel={renderItem}
                    renderListItemOptions={renderListItemOptions}
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
                    noResultFound={<NewEntryButton onClick={() => setShowNewEntryModal(true)} />}
                />
            </>
        );
    }

    return (
        <MultiAutoComplete
            {...bind}
            renderItem={renderItem}
            renderListItemLabel={renderItem}
            renderListItemOptions={renderListItemOptions}
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
