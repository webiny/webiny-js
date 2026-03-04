import React, { useState } from "react";
import debounce from "lodash/debounce.js";
import { NewEntryButton } from "./NewEntryButton.js";
import { AutoComplete } from "@webiny/ui/AutoComplete/index.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { SimpleLink } from "@webiny/app-admin";
import { useNewRefEntry } from "../hooks/useNewRefEntry.js";
import { useReference } from "./useReference.js";
import { renderItem } from "./renderItem.js";
import { createEntryUrl } from "./createEntryUrl.js";
import type { CmsModelField } from "~/types.js";
import type { BindComponentRenderProp } from "@webiny/form";
import { useEffectiveRules } from "@webiny/app-headless-cms-common";
import { useModelField, useModels } from "~/admin/hooks/index.js";
import { NewReferencedEntryDialog } from "~/admin/plugins/fieldRenderers/ref/components/NewReferencedEntryDialog.js";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const unpublishedLabel = t`Selected content entry is not published. Make sure to {publishItLink} before publishing the main content entry.`;
const publishedLabel = t`Selected content entry is published. You can view it {here}.`;

interface ContentEntriesAutocompleteProps {
    bind: BindComponentRenderProp;
    field: CmsModelField;
}
const ContentEntriesAutocomplete = ({ bind }: ContentEntriesAutocompleteProps) => {
    const { field } = useModelField();
    const rules = useEffectiveRules(field);
    const { models } = useModels();
    const [showNewEntryModal, setShowNewEntryModal] = useState(false);
    const { options, setSearch, value, loading, onChange } = useReference({
        bind,
        field
    });

    const disabled = !rules.canEdit || rules.disabled;

    let entryInfo: string | null = null;
    if (value && !value.published) {
        const link = createEntryUrl(value);
        entryInfo = unpublishedLabel({
            publishItLink: <SimpleLink to={link}>{t`publish it`}</SimpleLink>
        });
    } else if (value) {
        const link = createEntryUrl(value);
        entryInfo = publishedLabel({
            here: <SimpleLink to={link}>{t`here`}</SimpleLink>
        });
    }
    const { renderNewEntryModal, refModelId, help } = useNewRefEntry({ field });
    const model = models.find(model => model.modelId === refModelId);

    /*
     * Wrap AutoComplete input in NewRefEntry modal.
     */
    if (renderNewEntryModal) {
        return (
            <>
                {showNewEntryModal && model ? (
                    <NewReferencedEntryDialog
                        onClose={() => setShowNewEntryModal(false)}
                        model={model}
                        onChange={entry => {
                            return onChange(entry, entry);
                        }}
                    />
                ) : null}

                <AutoComplete
                    {...bind}
                    renderItem={renderItem}
                    onChange={onChange}
                    loading={loading}
                    value={value || undefined}
                    options={options}
                    label={field.label}
                    note={entryInfo}
                    data-testid={`fr.input.autocomplete.${field.label}`}
                    description={<>{field.help}</>}
                    onInput={debounce(search => setSearch(search), 250)}
                    noResultFound={<NewEntryButton onClick={() => setShowNewEntryModal(true)} />}
                />
            </>
        );
    }

    return (
        <AutoComplete
            {...bind}
            disabled={disabled}
            renderItem={renderItem}
            onChange={onChange}
            loading={loading}
            value={value || undefined}
            options={options}
            label={field.label}
            description={<>{field.help}</>}
            note={entryInfo}
            onInput={debounce(search => setSearch(search), 250)}
            noResultFound={help}
        />
    );
};

export default ContentEntriesAutocomplete;
