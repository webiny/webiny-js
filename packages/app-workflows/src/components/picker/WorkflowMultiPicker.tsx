import React from "react";
import { useState } from "react";
import { MultiAutoComplete } from "@webiny/admin-ui";
import type { PickerOption } from "./PickerOption.js";
import { PickerChip } from "./PickerChip.js";
import { getPickerEmptyMessage } from "./getPickerEmptyMessage.js";
import { limitPickerOptions } from "./limitPickerOptions.js";
import { renderPickerOption } from "./renderPickerOption.js";
import { resolvePickerSelection } from "./resolvePickerSelection.js";
import { toPickerCommandOptions } from "./toPickerCommandOptions.js";
import { usePickerRemountKey } from "./usePickerRemountKey.js";
import { usePickerFocusRestore } from "./usePickerFocusRestore.js";

export interface WorkflowMultiPickerProps {
    values: string[];
    selected: PickerOption[];
    options: PickerOption[];
    onSearch(search: string): void;
    onChange(ids: string[]): void;
    placeholder: string;
    disabled: boolean;
    error: string | null;
    label: string;
    description?: string;
    required?: boolean;
}

/*
 * The shared searchable multi picker (R282, UI-3) over admin-ui `MultiAutoComplete`. `options` are
 * the search results (shown up to 50); `selected` are the chosen items with their labels, so a chip
 * keeps its label when a search narrows the list. A chosen id nobody knows is a chip "Unknown item"
 * with a warning; an option with a warning shows it on its chip and in the list.
 */
export const WorkflowMultiPicker = (props: WorkflowMultiPickerProps) => {
    const { values, selected, options, onSearch, onChange, placeholder, disabled, error } = props;
    const [query, setQuery] = useState("");

    const limited = limitPickerOptions(options);
    const chosen = resolvePickerSelection(values, selected, options);
    const remountKey = usePickerRemountKey(chosen);
    const focusRestore = usePickerFocusRestore(remountKey);
    const commandOptions = toPickerCommandOptions(chosen, limited.options, limited.hasMore, query);
    const emptyMessage = getPickerEmptyMessage(query);
    const validation = error === null ? undefined : { isValid: false, message: error };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setQuery("");
        }
    };

    const handleSearch = (search: string) => {
        setQuery(search);
        onSearch(search);
    };

    const handleChange = (ids: string[]) => {
        setQuery("");
        const uniqueIds = new Set(ids);
        onChange([...uniqueIds]);
    };

    const handleRemove = (id: string) => {
        const remaining = values.filter(value => value !== id);
        handleChange(remaining);
    };

    const renderChip = (option: PickerOption) => {
        return (
            <PickerChip
                key={option.id}
                option={option}
                disabled={disabled}
                onRemove={handleRemove}
            />
        );
    };

    return (
        <div className={"w-full"} {...focusRestore}>
            <MultiAutoComplete
                key={remountKey}
                uniqueValues
                label={props.label}
                description={props.description}
                required={props.required}
                placeholder={placeholder}
                disabled={disabled}
                options={commandOptions}
                values={values}
                emptyMessage={emptyMessage}
                initialMessage={emptyMessage}
                optionRenderer={renderPickerOption}
                selectedOptionRenderer={renderChip}
                validation={validation}
                onOpenChange={handleOpenChange}
                onValueSearch={handleSearch}
                onValuesChange={handleChange}
            />
        </div>
    );
};
