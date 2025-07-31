import type { FocusEventHandler } from "react";
import React from "react";
import { Tags as AdminTags } from "@webiny/admin-ui";
import type { FormComponentProps } from "~/types.js";

interface TagsProps extends FormComponentProps {
    /**
     * Component label.
     */
    label?: React.ReactNode;

    /**
     * Are input and chosen tags disabled?
     */
    disabled?: boolean;

    /**
     * Placeholder text for the form control. Set to a blank string to create a non-floating placeholder label.
     */
    placeholder?: string;

    /**
     * Description beneath the input.
     */
    description?: string;

    /**
     * A className for the root element.
     */
    className?: string;

    /**
     * A list of tags.
     */
    value?: string[];

    /**
     * Callback that gets executed on change of input value.
     */
    onInput?: <T = unknown>(value: T) => void;

    /**
     * Callback that gets executed when the input is focused.
     */
    onFocus?: FocusEventHandler<HTMLInputElement> | undefined;

    /**
     * Automatically focus on the tags input.
     */
    autoFocus?: boolean;

    /**
     * Protected tags cannot be removed by the user.
     */
    protectedTags?: string[];
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Tags` component from the `@webiny/admin-ui` package instead.
 */
export const Tags = (props: TagsProps) => {
    return <AdminTags {...props} />;
};

export default Tags;
