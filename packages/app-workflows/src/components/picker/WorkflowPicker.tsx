import React from "react";
import { useState } from "react";
import { AutoComplete } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { PickerOption } from "./PickerOption.js";
import { getPickerEmptyMessage } from "./getPickerEmptyMessage.js";
import { limitPickerOptions } from "./limitPickerOptions.js";
import { renderPickerOption } from "./renderPickerOption.js";
import { resolvePickerSelection } from "./resolvePickerSelection.js";
import { toPickerCommandOptions } from "./toPickerCommandOptions.js";
import { usePickerRemountKey } from "./usePickerRemountKey.js";

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
    description?: string;
    required?: boolean;
}

/*
 * The shared searchable single picker (R282, UI-3) over admin-ui `AutoComplete`. `options` are the
 * search results (shown up to 50); `selected` is the chosen item with its label, so the input keeps
 * it when a search narrows the list. A chosen id nobody knows shows as "Unknown item". The chosen
 * item's warning shows under the input, because the single input has no renderer for it (A100).
 */
export const WorkflowPicker = (props: WorkflowPickerProps) => {
    const { value, selected, options, onSearch, onChange, placeholder, disabled, error } = props;
    const [query, setQuery] = useState("");

    const limited = limitPickerOptions(options);
    const ids = value === null ? [] : [value];
    const chosen = resolvePickerSelection(ids, selected ? [selected] : [], options);
    const commandOptions = toPickerCommandOptions(chosen, limited.options, limited.hasMore, query);
    const emptyMessage = getPickerEmptyMessage(query);
    const validation = error === null ? undefined : { isValid: false, message: error };
    const warning = chosen.length > 0 ? chosen[0].warning : null;
    const remountKey = usePickerRemountKey(chosen);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setQuery("");
        }
    };

    const handleSearch = (search: string) => {
        setQuery(search);
        onSearch(search);
    };

    const handleChange = (id: string) => {
        setQuery("");
        onChange(id === "" ? null : id);
    };

    return (
        <div className={"w-full"}>
            <AutoComplete
                key={remountKey}
                label={props.label}
                description={props.description}
                required={props.required}
                placeholder={placeholder}
                disabled={disabled}
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
                <Text size={"sm"} className={"text-warning-xstrong"}>
                    {warning}
                </Text>
            )}
        </div>
    );
};
