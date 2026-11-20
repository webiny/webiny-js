import React from "react";
import { useState } from "react";
import { Button, Popover } from "@webiny/admin-ui";
import { ReactComponent as FilterIcon } from "@webiny/icons/filter_list.svg";
import type { ReviewContentTypeOption } from "../IReviewContentTypeFilter.js";
import { ReviewContentTypePicker } from "./ReviewContentTypePicker.js";

export interface ReviewContentTypeFilterProps {
    options: ReviewContentTypeOption[];
    value: string | null;
    onChange(value: string | null): void;
}

/*
 * The content type filter of the list: a "Filter" button that opens a popover with the content
 * type picker. The button shows when a filter is active; picking a value applies it and closes
 * the popover.
 */
export const ReviewContentTypeFilter = (props: ReviewContentTypeFilterProps) => {
    const { options, value, onChange } = props;
    const [open, setOpen] = useState(false);

    const active = value === null ? 0 : 1;
    const text = active > 0 ? `Filter · ${active}` : "Filter";

    const handleChange = (next: string | null) => {
        onChange(next);
        setOpen(false);
    };

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            align={"end"}
            trigger={
                <Button
                    variant={"tertiary"}
                    text={text}
                    icon={<FilterIcon />}
                    aria-label={active > 0 ? `Filter, ${active} active` : "Filter"}
                />
            }
            content={
                <div data-role="review-content-type-filter" className="w-2xs">
                    <ReviewContentTypePicker
                        options={options}
                        value={value}
                        onChange={handleChange}
                    />
                </div>
            }
        />
    );
};
