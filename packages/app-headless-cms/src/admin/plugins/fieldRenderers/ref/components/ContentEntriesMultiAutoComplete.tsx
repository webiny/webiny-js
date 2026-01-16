import React, { useCallback, useState } from "react";
import debounce from "lodash/debounce.js";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete/index.js";
import { RouteLink } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import { useReferences } from "./useReferences.js";
import { renderItem, renderListItemOptions } from "./renderItem.js";
import { NewEntryButton } from "./NewEntryButton.js";
import { useNewRefEntry } from "../hooks/useNewRefEntry.js";
import type { CmsModelField } from "~/types.js";
import type { BindComponentRenderProp } from "@webiny/form";
import type { OptionItem } from "./types.js";
import { useModels } from "~/admin/hooks/index.js";
import { NewReferencedEntryDialog } from "~/admin/plugins/fieldRenderers/ref/components/NewReferencedEntryDialog.js";
import { Routes } from "~/routes.js";

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
                <RouteLink route={Routes.ContentEntries.List} params={{ id, modelId }}>
                    {name}
                </RouteLink>
            </React.Fragment>
        );
    };

    const warnings = entries.filter(item => !item.published);
    let warning: React.ReactElement | null = null;
    if (warnings.length > 0) {
        warning = warn({
            entries: <>{warnings.map(entryWarning)}</>
        });
    }

    const refEntryOnChange = useCallback(
        (value: OptionItem) => {
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
                    description={<>{field.helpText}</>}
                    note={warning}
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
            description={<>{field.helpText}</>}
            note={warning}
            noResultFound={helpText}
        />
    );
};

export default ContentEntriesMultiAutocomplete;
