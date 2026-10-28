import React from "react";
import { useState } from "react";
import { AutoComplete } from "@webiny/admin-ui";
import { Alert } from "@webiny/admin-ui";
import type { PickerOption } from "./PickerOption.js";
import { getPickerEmptyMessage } from "./getPickerEmptyMessage.js";
import { limitPickerOptions } from "./limitPickerOptions.js";
import type { PickerFieldIcon } from "./PickerFieldIcon.js";
import { PickerFieldIconView } from "./PickerFieldIconView.js";
import { PickerOptionIconView } from "./PickerOptionIconView.js";
import { PICKER_ANY_VALUE } from "./pickerTexts.js";
import { renderPickerOption } from "./renderPickerOption.js";
import { resolvePickerSelection } from "./resolvePickerSelection.js";
import { toPickerCommandOptions } from "./toPickerCommandOptions.js";
import { usePickerRemountKey } from "./usePickerRemountKey.js";
import { usePickerFocusRestore } from "./usePickerFocusRestore.js";
import { usePickerSearchReset } from "./usePickerSearchReset.js";

export interface WorkflowPickerProps {
    value: string | null;
    selected: PickerOption | null;
    options: PickerOption[];
    onSearch(search: string): void;
    onChange(id: string | null): void;
    placeholder: string;
    disabled: boolean;
    error: string | null;
    label: string;
    // The hint under the field (admin-ui `note`, C8).
    description?: string;
    required?: boolean;
    /*
     * The label of a first clear row (R307): picking it gives `null`, and the field shows it as its
     * placeholder text while nothing is chosen and nothing is typed. It wins over `placeholder`.
     */
    anyLabel?: string | null;
    // The icon in front of the field while no muted item is chosen. Defaults to "search".
    icon?: PickerFieldIcon;
    // Whether a chosen value can be cleared with the × button. Defaults to true.
    clearable?: boolean;
}

/*
 * The shared searchable single picker (R282, R307, UI-3) over admin-ui `AutoComplete`. `options`
 * are the search results (shown up to 50); `selected` is the chosen item with its label, so the
 * input keeps it when a search narrows the list. A chosen id nobody knows shows as "Unknown item".
 * The chosen item's warning shows under the input, because the single input has no renderer for it
 * (A100). An option can be muted, disabled and carry an icon; a chosen muted option shows its icon
 * in the input. `anyLabel` adds the clear row.
 */
export const WorkflowPicker = (props: WorkflowPickerProps) => {
    const { value, selected, options, onSearch, onChange, placeholder, disabled, error } = props;
    const anyLabel = props.anyLabel ?? null;
    const icon = props.icon ?? "search";
    const clearable = props.clearable ?? true;
    const [query, setQuery] = useState("");

    const limited = limitPickerOptions(options);
    const ids = value === null ? [] : [value];
    const chosen = resolvePickerSelection(ids, selected ? [selected] : [], options);
    const commandOptions = toPickerCommandOptions(
        chosen,
        limited.options,
        limited.hasMore,
        query,
        anyLabel
    );
    const emptyMessage = getPickerEmptyMessage(query);
    const validation = error === null ? undefined : { isValid: false, message: error };
    const warning = chosen.length > 0 ? chosen[0].warning : null;
    const remountKey = usePickerRemountKey(chosen);
    const focusRestore = usePickerFocusRestore(remountKey);
    usePickerSearchReset(remountKey, query, () => {
        setQuery("");
        onSearch("");
    });

    /*
     * The input holds only the label, so a chosen muted item (a deleted user or team, D117) shows
     * its muted icon in front of it, as it does in the list.
     */
    let startIcon: React.ReactElement = <PickerFieldIconView name={icon} />;
    const chosenOption = chosen.length > 0 ? chosen[0] : null;
    if (chosenOption !== null && chosenOption.muted && chosenOption.icon !== null) {
        startIcon = <PickerOptionIconView name={chosenOption.icon} muted={true} />;
    }

    let shownPlaceholder = placeholder;
    if (anyLabel !== null) {
        shownPlaceholder = anyLabel;
    }

    const handleOpenChange = (open: boolean) => {
        // The parent searched for the typed text; it starts over when the picker closes.
        if (!open && query !== "") {
            setQuery("");
            onSearch("");
        }
    };

    const handleSearch = (search: string) => {
        setQuery(search);
        onSearch(search);
    };

    const handleChange = (id: string) => {
        if (query !== "") {
            setQuery("");
            onSearch("");
        }
        if (id === "" || id === PICKER_ANY_VALUE) {
            onChange(null);
            return;
        }
        onChange(id);
    };

    return (
        <div className={"w-full"} {...focusRestore}>
            <AutoComplete
                key={remountKey}
                label={props.label}
                note={props.description}
                required={props.required}
                placeholder={shownPlaceholder}
                disabled={disabled}
                startIcon={startIcon}
                displayResetAction={clearable && value !== null && !disabled}
                options={commandOptions}
                value={value ?? undefined}
                emptyMessage={emptyMessage}
                initialMessage={emptyMessage}
                optionRenderer={renderPickerOption}
                validation={validation}
                onOpenChange={handleOpenChange}
                onValueSearch={handleSearch}
                onValueChange={handleChange}
            />
            {warning !== null && (
                <Alert type={"warning"} variant={"subtle"}>
                    {warning}
                </Alert>
            )}
        </div>
    );
};
