import React, { useCallback, useState, useMemo } from "react";
import debounce from "lodash/debounce.js";
import { MultiAutoComplete } from "@webiny/admin-ui";
import { RouteLink } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import { useReferences } from "./useReferences.js";
import { NewEntryButton } from "./NewEntryButton.js";
import { useNewRefEntry } from "../hooks/useNewRefEntry.js";
import type { CmsModelField } from "~/types.js";
import type { BindComponentRenderProp } from "@webiny/form";
import type { OptionItem } from "./types.js";
import { useFieldEffectiveRules } from "@webiny/app-headless-cms-common";
import { useModelField, useModels } from "~/admin/hooks/index.js";
import { NewReferencedEntryDialog } from "~/admin/plugins/fieldRenderers/ref/components/NewReferencedEntryDialog.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const warn = t`Before publishing the main content entry, make sure you publish the following referenced entries: {entries}`;

interface ContentEntriesMultiAutocompleteProps {
    bind: BindComponentRenderProp;
    field: CmsModelField;
}
const ContentEntriesMultiAutocomplete = ({ bind }: ContentEntriesMultiAutocompleteProps) => {
    const { field } = useModelField();
    const rules = useFieldEffectiveRules(field);
    const { models } = useModels();
    const [showNewEntryModal, setShowNewEntryModal] = useState(false);
    const {
        options: rawOptions,
        setSearch,
        entries,
        loading,
        onChange
    } = useReferences({
        bind,
        field
    });
    const disabled = !rules.canEdit || rules.disabled;

    const { renderNewEntryModal, refModelId, help } = useNewRefEntry({ field });

    const options = useMemo(
        () => rawOptions.map(opt => ({ label: opt.name, value: opt.entryId, item: opt })),
        [rawOptions]
    );

    const currentValues = useMemo(() => entries.map(e => e.entryId), [entries]);

    const onValuesChange = useCallback(
        (entryIds: string[]) => {
            const selectedItems = entryIds
                .map(id => options.find(o => o.value === id)?.item)
                .filter(Boolean) as OptionItem[];
            onChange(selectedItems);
        },
        [options, onChange]
    );

    const onValueSearch = useCallback(
        debounce((search: string) => setSearch(search), 250),
        [setSearch]
    );

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
            onChange([...entries, value]);
            setShowNewEntryModal(false);
        },
        [onChange, entries]
    );

    const model = models.find(m => m.modelId === refModelId);

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
                    validation={bind.validation}
                    loading={loading}
                    values={currentValues}
                    options={options}
                    label={field.label}
                    onValuesChange={onValuesChange}
                    onValueSearch={onValueSearch}
                    description={<>{field.help}</>}
                    note={warning}
                    emptyMessage={<NewEntryButton onClick={() => setShowNewEntryModal(true)} />}
                />
            </>
        );
    }

    return (
        <MultiAutoComplete
            disabled={disabled}
            validation={bind.validation}
            loading={loading}
            values={currentValues}
            options={options}
            label={field.label}
            onValuesChange={onValuesChange}
            onValueSearch={onValueSearch}
            description={<>{field.help}</>}
            note={warning}
            emptyMessage={help}
        />
    );
};

export default ContentEntriesMultiAutocomplete;
