import React from "react";
import { Typography } from "@webiny/ui/Typography";
import { Tooltip } from "@webiny/ui/Tooltip";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import styled from "@emotion/styled";

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

import { Switch } from "@webiny/ui/Switch";
import { ReactComponent as EditIcon } from "../../../../../icons/edit.svg";
import { ReactComponent as DeleteIcon } from "../../../../../icons/delete.svg";
import { BindComponent } from "@webiny/form/types";
import { FieldOption } from "~/admin/plugins/editor/formFields/components/types";

const OptionList = styled("ul")({
    padding: 25,
    border: "1px solid var(--mdc-theme-on-background)"
});

const optionsListItemLeft = css({
    display: "flex",
    justifyContent: "left",
    alignItems: "center",
    ">div": {
        display: "flex",
        flexDirection: "column",
        marginLeft: 10,
        color: "var(--mdc-theme-on-surface)",
        span: {
            lineHeight: "125%"
        }
    }
});

const optionsListItemRight = css({
    display: "flex",
    justifyContent: "right",
    alignItems: "center"
});

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
                value={selected}
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
            value={selected}
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

export type FieldOptionWithId = FieldOption & { id?: number };

interface SortableContainerWrapperProps {
    optionsValue: FieldOptionWithId[];
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
                <OptionList>{children}</OptionList>
            </SortableContext>
        </DndContext>
    );
};

type OptionsListItemProps = {
    multiple: boolean;
    dragHandle: React.ReactNode;
    option: { label: string; value: string; id?: number };
    Bind: BindComponent;
    deleteOption: () => void;
    editOption: () => void;
};

export default function OptionsListItem(props: OptionsListItemProps) {
    const { multiple, dragHandle, Bind, option, deleteOption, editOption } = props;

    const { attributes, listeners, setNodeRef, transform } = useSortable({ id: option.id || "" });
    const style = {
        transform: CSS.Transform.toString(transform)
    };

    return (
        <>
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                <div className={optionsListItemLeft}>
                    <Tooltip
                        placement={"bottom"}
                        content={<span>Drag to rearrange the order</span>}
                    >
                        <span>{dragHandle}</span>
                    </Tooltip>
                    <div>
                        <Typography use={"subtitle1"}>{option.label}</Typography>
                        <Typography use={"caption"}>{option.value}</Typography>
                    </div>
                </div>
            </div>
            <div className={optionsListItemRight}>
                <IconButton icon={<EditIcon />} onClick={editOption} />
                <IconButton icon={<DeleteIcon />} onClick={deleteOption} />

                <Bind name={"settings.defaultValue"}>
                    {({ onChange, value }) => (
                        <Tooltip placement={"bottom"} content={<span>Set as default value</span>}>
                            <DefaultValueSwitch
                                onChange={onChange}
                                value={value}
                                multiple={multiple}
                                option={option}
                            />
                        </Tooltip>
                    )}
                </Bind>
            </div>
        </>
    );
}
