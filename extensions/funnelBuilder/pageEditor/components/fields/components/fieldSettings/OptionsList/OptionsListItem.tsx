import React from "react";
import { Tooltip, IconButton, Switch, Icon } from "webiny/admin/ui";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    closestCenter,
    DragEndEvent,
    UniqueIdentifier
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext } from "@dnd-kit/sortable";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/delete.svg";
import { ReactComponent as DragIndicator } from "webiny/admin/icons/drag_indicator.svg";
import type { BindComponent } from "@webiny/form/types";
import { FieldOption } from "./types";

interface DefaultValueSwitchProps {
    multiple: boolean;
    option: FieldOption;
    value: string[] | string;
    onChange: (value: string[] | string) => void;
}

const DefaultValueSwitch = ({
    multiple,
    option,
    value: currentDefaultValue,
    onChange: setDefaultValue
}: DefaultValueSwitchProps) => {
    if (multiple) {
        const selected =
            Array.isArray(currentDefaultValue) && currentDefaultValue.includes(option.value);

        return (
            <Switch
                label={""}
                checked={selected}
                onChange={() => {
                    if (selected) {
                        const value = Array.isArray(currentDefaultValue)
                            ? [...currentDefaultValue]
                            : [];
                        value.splice(value.indexOf(option.value), 1);
                        setDefaultValue(value);
                    } else {
                        const value = Array.isArray(currentDefaultValue)
                            ? [...currentDefaultValue]
                            : [];
                        value.push(option.value);
                        setDefaultValue(value);
                    }
                }}
            />
        );
    }

    const selected = currentDefaultValue === option.value;
    return (
        <Switch
            label={""}
            checked={selected}
            onChange={() => {
                const newValue = selected ? "" : option.value;
                setDefaultValue(newValue);
            }}
        />
    );
};

export type SortableContextItemsProp = (
    | UniqueIdentifier
    | {
          id: UniqueIdentifier;
      }
)[];

interface SortableContainerWrapperProps {
    optionsValue: FieldOption[];
    children: React.ReactNode;
    onDragEnd: (event: DragEndEvent) => void;
}

export const SortableContainerContextProvider = ({
    optionsValue,
    children,
    onDragEnd
}: SortableContainerWrapperProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={optionsValue as unknown as SortableContextItemsProp}>
                <ul className={"m-0 list-none rounded p-0"}>{children}</ul>
            </SortableContext>
        </DndContext>
    );
};

type OptionsListItemProps = {
    multiple: boolean;
    option: { label: string; value: string; id: string };
    Bind: BindComponent;
    deleteOption: () => void;
};

export const OptionsListItem = (props: OptionsListItemProps) => {
    const { multiple, Bind, option, deleteOption } = props;

    const { attributes, listeners, setNodeRef, transform } = useSortable({ id: option.id || "" });
    const style = {
        transform: CSS.Transform.toString(transform)
    };

    return (
        <div ref={setNodeRef} style={style} className={"flex w-full items-center"} {...attributes}>
            <div className={"flex flex-1 items-center gap-sm"}>
                <Tooltip
                    content={<span>Drag to reorder</span>}
                    trigger={
                        <span {...listeners} className={"cursor-grab"}>
                            <Icon icon={<DragIndicator />} label={"Drag to reorder"} />
                        </span>
                    }
                />
                <span className={"ml-2"}>{option.label}</span>
            </div>
            <div className={"flex items-center justify-end gap-sm"}>
                <Bind name={"value.value"}>
                    {({ onChange, value }) => (
                        <Tooltip
                            content={"Set as default value"}
                            trigger={
                                <DefaultValueSwitch
                                    onChange={onChange}
                                    value={value}
                                    multiple={multiple}
                                    option={option}
                                />
                            }
                        />
                    )}
                </Bind>
                <IconButton icon={<DeleteIcon />} onClick={deleteOption} variant={"ghost"} />
            </div>
        </div>
    );
};
