import React, { useCallback, useState } from "react";
import { Heading } from "~/Heading/index.js";
import { Input } from "~/Input/index.js";
import { Tooltip } from "~/Tooltip/index.js";
import { cn, makeDecoratable } from "~/utils.js";

interface EditableTitleProps {
    /**
     * The current title value.
     */
    value: string;
    /**
     * Called with the new value when editing is committed (blur or Enter).
     */
    onCommit: (value: string) => void;
    /**
     * If true, the title is rendered as plain (non-editable) text.
     */
    readOnly?: boolean;
    /**
     * Placeholder shown in the input while editing.
     */
    placeholder?: string;
    /**
     * Focus the input when entering edit mode. Defaults to `true`.
     */
    autoFocus?: boolean;
    /**
     * Select the input's content when entering edit mode. Defaults to `true`.
     */
    autoSelect?: boolean;
    /**
     * Content rendered before the title (e.g. a language tag).
     */
    startContent?: React.ReactNode;
    /**
     * Tooltip content shown when hovering the resting title.
     */
    tooltip?: React.ReactNode;
    /**
     * Controls the editing state. When provided, the component is controlled
     * and `onEditingChange` must be used to react to state changes.
     */
    isEditing?: boolean;
    /**
     * Called whenever the editing state should change.
     */
    onEditingChange?: (editing: boolean) => void;
    className?: string;
    "data-testid"?: string;
}

const DecoratableEditableTitle = ({
    value,
    onCommit,
    readOnly,
    placeholder,
    autoFocus = true,
    autoSelect = true,
    startContent,
    tooltip,
    isEditing: controlledEditing,
    onEditingChange,
    className,
    "data-testid": dataTestId
}: EditableTitleProps) => {
    const isControlled = controlledEditing !== undefined;
    const [uncontrolledEditing, setUncontrolledEditing] = useState(false);
    const [localValue, setLocalValue] = useState<string | undefined>();

    const isEditing = isControlled ? controlledEditing : uncontrolledEditing;

    const setEditing = useCallback(
        (editing: boolean) => {
            if (!isControlled) {
                setUncontrolledEditing(editing);
            }
            onEditingChange?.(editing);
        },
        [isControlled, onEditingChange]
    );

    const startEditing = useCallback(() => {
        setLocalValue(value);
        setEditing(true);
    }, [value, setEditing]);

    const commit = useCallback(
        (next: string) => {
            onCommit(next);
            setLocalValue(undefined);
            setEditing(false);
        },
        [onCommit, setEditing]
    );

    const cancel = useCallback(() => {
        setLocalValue(undefined);
        setEditing(false);
    }, [setEditing]);

    const wrapper = (children: React.ReactNode) => (
        <div className={cn("flex min-w-0 flex-row items-center gap-sm", className)}>
            {startContent}
            {children}
        </div>
    );

    if (readOnly) {
        return wrapper(
            <Heading
                level={5}
                className={"text-accent-primary truncate px-sm-extra py-xs-plus"}
                data-testid={dataTestId}
            >
                {value}
            </Heading>
        );
    }

    if (isEditing) {
        return wrapper(
            <Input
                autoFocus={autoFocus}
                autoSelect={autoSelect}
                size={"md"}
                variant={"secondary"}
                placeholder={placeholder}
                value={localValue ?? value}
                onChange={setLocalValue}
                onBlur={e => commit(e.currentTarget.value)}
                onEnter={e => commit(e.currentTarget.value)}
                onEscape={cancel}
            />
        );
    }

    const trigger = (
        <div
            onClick={startEditing}
            data-testid={dataTestId}
            className={cn(
                "font-sans text-h5 cursor-pointer truncate rounded-md",
                "px-[calc(var(--padding-sm-extra)-var(--border-width-sm))] py-[calc(var(--padding-xs)-var(--border-width-sm))]",
                "border-sm border-transparent text-accent-primary",
                "hover:bg-neutral-light"
            )}
        >
            {value}
        </div>
    );

    return wrapper(
        tooltip ? <Tooltip side={"bottom"} content={tooltip} trigger={trigger} /> : trigger
    );
};

const EditableTitle = makeDecoratable("EditableTitle", DecoratableEditableTitle);

export { EditableTitle, type EditableTitleProps };
