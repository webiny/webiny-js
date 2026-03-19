import React from "react";
import { Tooltip, IconButton, Switch } from "webiny/admin/ui";
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
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import type { BindComponent } from "@webiny/form/types";
import { FieldOption } from "./types";

const OptionList = styled.ul`
    padding: 25px;
    border: 1px solid var(--mdc-theme-on-background);
`;

const OptionsListItemLeft = styled.div({
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

const OptionsListItemRight = styled.div({
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
                <OptionList>{children}</OptionList>
            </SortableContext>
        </DndContext>
    );
};

type OptionsListItemProps = {
    multiple: boolean;
    dragHandle: React.ReactNode;
    option: { label: string; value: string; id: string };
    Bind: BindComponent;
    deleteOption: () => void;
};

export const OptionsListItem = (props: OptionsListItemProps) => {
    const { multiple, dragHandle, Bind, option, deleteOption } = props;

    const { attributes, listeners, setNodeRef, transform } = useSortable({ id: option.id || "" });
    const style = {
        transform: CSS.Transform.toString(transform)
    };

    return (
        <>
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                <OptionsListItemLeft>
                    <Tooltip
                        content={<span>Drag to rearrange the order</span>}
                        trigger={<span>{dragHandle}</span>}
                    />
                    <div>
                        <span>{option.label}</span>
                        <span>{option.value}</span>
                    </div>
                </OptionsListItemLeft>
            </div>
            <OptionsListItemRight>
                <IconButton icon={<DeleteIcon />} onClick={deleteOption} />

                <Bind name={"value.value"}>
                    {({ onChange, value }) => (
                        <Tooltip
                            content={<span>Set as default value</span>}
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
            </OptionsListItemRight>
        </>
    );
};
