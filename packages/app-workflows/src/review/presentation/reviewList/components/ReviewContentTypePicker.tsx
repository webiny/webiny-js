import React from "react";
import { useState } from "react";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import { WIDGET_APP_LABELS } from "~/review/presentation/widgetAppLabels.js";
import type { ReviewContentTypeOption } from "../IReviewContentTypeFilter.js";

export interface ReviewContentTypePickerProps {
    options: ReviewContentTypeOption[];
    value: string | null;
    onChange(value: string | null): void;
}

const toPickerOption = (option: ReviewContentTypeOption): PickerOption => {
    return {
        id: option.value,
        label: option.label,
        description: WIDGET_APP_LABELS[option.app],
        warning: null,
        muted: false,
        disabled: false,
        icon: option.icon,
        note: null
    };
};

/*
 * The content type filter of the list: the shared picker over the options the app supplies,
 * searched client-side by label.
 */
export const ReviewContentTypePicker = (props: ReviewContentTypePickerProps) => {
    const { options, value, onChange } = props;
    const [search, setSearch] = useState("");

    const all = options.map(toPickerOption);
    const needle = search.trim().toLowerCase();
    const shown = all.filter(option => option.label.toLowerCase().includes(needle));
    const selected = all.find(option => option.id === value) ?? null;

    return (
        <WorkflowPicker
            value={value}
            selected={selected}
            options={shown}
            onSearch={setSearch}
            onChange={onChange}
            placeholder={"All content types"}
            anyLabel={"All content types"}
            icon={"filter_list"}
            disabled={false}
            error={null}
            label={""}
        />
    );
};
