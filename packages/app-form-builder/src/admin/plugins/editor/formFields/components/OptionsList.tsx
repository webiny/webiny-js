import React, { useState } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import camelCase from "lodash/camelCase";
import cloneDeep from "lodash/cloneDeep";
import { OptionsListItem, AddOptionInput, EditFieldOptionDialog } from "./OptionsListComponents";
/**
 * Package react-sortable-hoc is missing types.
 */
// @ts-expect-error
import { sortableContainer, sortableElement, sortableHandle } from "react-sortable-hoc";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { Switch } from "@webiny/ui/Switch";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ReactComponent as HandleIcon } from "../../../../icons/round-drag_indicator-24px.svg";
import { validation } from "@webiny/validation";
import { BindComponent, FormRenderPropParams } from "@webiny/form/types";
import { FieldOption } from "./types";

const OptionList = styled("ul")({
    padding: 25,
    border: "1px solid var(--mdc-theme-on-background)"
});

const OptionListItem = styled("li")({
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid var(--mdc-theme-background)",
    background: "var(--mdc-theme-surface)",
    "&:hover": {
        background: "var(--mdc-theme-background)"
    },
    "&:last-child": {
        border: "none"
    }
});

const switchWrapper = css`
    align-self: end;
    height: 100%;
    display: flex;
    align-items: center;

    .switch-label {
        margin-right: 12px;

        strong {
            font-weight: 600;
        }
    }
`;

const sortableList = css({
    zIndex: 20
});

const DragHandle = sortableHandle(() => (
    <Icon icon={<HandleIcon style={{ cursor: "pointer" }} />} />
));

interface OnSortEndParams {
    oldIndex: number;
    newIndex: number;
}

interface OnSortEndCallable {
    (params: OnSortEndParams): void;
}

interface SortableContainerProps {
    children: React.ReactElement[];
    helperClass: string;
    useDragHandle: boolean;
    transitionDuration: number;
    onSortEnd: OnSortEndCallable;
}
const SortableContainer = sortableContainer(({ children }: SortableContainerProps) => {
    return <OptionList>{children}</OptionList>;
});

interface SetEditOptionParams {
    index: number | null;
    data: FieldOption | null;
}
interface SortableItemProps {
    setOptionsValue: (value: FieldOption[]) => void;
    setEditOption: (params: SetEditOptionParams) => void;
    option: FieldOption;
    optionsValue: FieldOption[];
    optionIndex: number;
    multiple?: boolean;
    Bind: BindComponent;
    index: number;
}
const SortableItem = sortableElement(
    ({
        setOptionsValue,
        setEditOption,
        option,
        optionsValue: options,
        Bind,
        multiple,
        optionIndex
    }: SortableItemProps) => (
        <OptionListItem>
            <OptionsListItem
                dragHandle={<DragHandle />}
                key={option.value}
                Bind={Bind}
                multiple={!!multiple}
                option={option}
                deleteOption={() => {
                    const newValue = [...options];
                    newValue.splice(optionIndex, 1);
                    setOptionsValue(newValue);
                }}
                editOption={() => setEditOption({ index: optionIndex, data: cloneDeep(option) })}
            />
        </OptionListItem>
    )
);

interface OptionsListProps {
    form: FormRenderPropParams;
    multiple?: boolean;
    otherOption?: boolean;
}
interface OptionsListBindParams {
    validation: any;
    value: FieldOption[];
    onChange: (values: FieldOption[]) => void;
}

const OptionsList = ({ form, multiple, otherOption }: OptionsListProps) => {
    const { Bind } = form;

    const [editOption, setEditOption] = useState<SetEditOptionParams>({
        data: null,
        index: null
    });
    const clearEditOption = (): void =>
        setEditOption({
            data: null,
            index: null
        });

    return (
        <Bind name={"options"} validators={validation.create("required,minLength:1")}>
            {(bind: OptionsListBindParams) => {
                const {
                    validation: optionsValidation,
                    value: optionsValue,
                    onChange: setOptionsValue
                } = bind;
                const onSubmit = (data: FieldOption): void => {
                    const newValue = [...optionsValue];
                    newValue.splice(editOption.index as number, 1, data);
                    setOptionsValue(newValue);
                    clearEditOption();
                };
                return (
                    <>
                        <div>Options</div>
                        <Grid>
                            <Cell span={otherOption ? 9 : 12}>
                                <AddOptionInput
                                    options={optionsValue}
                                    validation={optionsValidation}
                                    onAdd={label => {
                                        const newValue = Array.isArray(optionsValue)
                                            ? [...optionsValue]
                                            : [];
                                        newValue.push({
                                            value: camelCase(label),
                                            label
                                        });
                                        setOptionsValue(newValue);
                                    }}
                                />
                            </Cell>
                            {otherOption && (
                                <Cell span={3} className={switchWrapper}>
                                    <Typography use={"button"} className="switch-label">
                                        Allow &quot;<strong>Other</strong>&quot;
                                    </Typography>
                                    <Bind name={"settings.otherOption"}>
                                        <Switch />
                                    </Bind>
                                </Cell>
                            )}
                        </Grid>

                        <div style={{ position: "relative" }}>
                            {Array.isArray(optionsValue) && optionsValue.length > 0 ? (
                                <SortableContainer
                                    helperClass={sortableList}
                                    useDragHandle
                                    transitionDuration={0}
                                    onSortEnd={({ oldIndex, newIndex }: OnSortEndParams) => {
                                        const newValue = [...optionsValue];
                                        const [movedItem] = newValue.splice(oldIndex, 1);
                                        newValue.splice(newIndex, 0, movedItem);
                                        setOptionsValue(newValue);
                                    }}
                                >
                                    {optionsValue.map((item, index) => (
                                        <SortableItem
                                            key={`item-${index}`}
                                            Bind={Bind}
                                            multiple={multiple}
                                            setEditOption={setEditOption}
                                            setOptionsValue={setOptionsValue}
                                            option={item}
                                            optionsValue={optionsValue}
                                            optionIndex={index}
                                            index={index}
                                        />
                                    ))}
                                </SortableContainer>
                            ) : (
                                <div style={{ padding: 40, textAlign: "center" }}>
                                    No options added.
                                </div>
                            )}
                        </div>

                        <EditFieldOptionDialog
                            onClose={clearEditOption}
                            open={!!editOption.data}
                            options={optionsValue}
                            option={editOption.data}
                            optionIndex={editOption.index as number}
                            onSubmit={onSubmit}
                        />
                    </>
                );
            }}
        </Bind>
    );
};

export default OptionsList;
