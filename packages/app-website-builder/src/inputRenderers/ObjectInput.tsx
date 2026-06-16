import React from "react";
import { Button, Label, Separator, Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as MoveUpIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import { ReactComponent as MoveDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";

interface ObjectFieldShellProps {
    label?: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Presentational shell for a single (non-list) object field: an optional label followed by the
 * nested child inputs, visually grouped with a left border to convey nesting.
 */
export const ObjectFieldShell = ({ label, description, children }: ObjectFieldShellProps) => {
    return (
        <div className={"wb-object-field flex flex-col gap-sm"}>
            {label ? <Label text={label} description={description} /> : null}
            <div className={"flex flex-col gap-md border-l border-neutral-dimmed pl-md"}>
                {children}
            </div>
        </div>
    );
};

export interface ObjectListItem {
    key: string;
    content: React.ReactNode;
}

interface ObjectListShellProps {
    label?: React.ReactNode;
    description?: React.ReactNode;
    items: ObjectListItem[];
    addLabel?: string;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
}

/**
 * Presentational shell for a repeatable (list) object field. Each item is a bordered card with
 * move-up / move-down / remove controls; an "Add" button appends a new item.
 */
export const ObjectListShell = ({
    label,
    description,
    items,
    addLabel = "Add item",
    onAdd,
    onRemove,
    onMoveUp,
    onMoveDown
}: ObjectListShellProps) => {
    return (
        <div className={"wb-object-list-field flex flex-col gap-sm"}>
            {label ? <Label text={label} description={description} /> : null}
            {items.length === 0 ? (
                <Text size={"sm"} className={"text-neutral-strong"}>
                    No items yet.
                </Text>
            ) : (
                <div className={"flex flex-col gap-sm"}>
                    {items.map((item, index) => (
                        <div
                            key={item.key}
                            className={
                                "flex flex-col gap-sm rounded-md border border-neutral-dimmed p-sm"
                            }
                        >
                            <div className={"flex items-center justify-between"}>
                                <Text size={"sm"} className={"text-neutral-strong"}>
                                    {`#${index + 1}`}
                                </Text>
                                <div className={"flex items-center gap-xs"}>
                                    <Button
                                        variant={"ghost"}
                                        size={"sm"}
                                        icon={<MoveUpIcon />}
                                        disabled={index === 0}
                                        onClick={() => onMoveUp(index)}
                                    />
                                    <Button
                                        variant={"ghost"}
                                        size={"sm"}
                                        icon={<MoveDownIcon />}
                                        disabled={index === items.length - 1}
                                        onClick={() => onMoveDown(index)}
                                    />
                                    <Button
                                        variant={"ghost"}
                                        size={"sm"}
                                        icon={<DeleteIcon />}
                                        onClick={() => onRemove(index)}
                                    />
                                </div>
                            </div>
                            <Separator margin={"none"} />
                            <div className={"flex flex-col gap-md"}>{item.content}</div>
                        </div>
                    ))}
                </div>
            )}
            <div>
                <Button
                    variant={"secondary"}
                    size={"sm"}
                    icon={<AddIcon />}
                    text={addLabel}
                    onClick={onAdd}
                />
            </div>
        </div>
    );
};
