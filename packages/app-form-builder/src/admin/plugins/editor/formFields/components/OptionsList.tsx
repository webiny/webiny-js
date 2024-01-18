import React, { useState } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import camelCase from "lodash/camelCase";
import cloneDeep from "lodash/cloneDeep";
import { OptionsListItem, AddOptionInput, EditFieldOptionDialog } from "./OptionsListComponents";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { Switch } from "@webiny/ui/Switch";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ReactComponent as HandleIcon } from "../../../../icons/round-drag_indicator-24px.svg";
import { validation } from "@webiny/validation";
import { FormRenderPropParams } from "@webiny/form/types";
import { FieldOption } from "./types";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
    SortableContainerContextProvider,
    FieldOptionWithId
} from "./OptionsListComponents/OptionsListItem";

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

const DragHandle = () => <Icon icon={<HandleIcon style={{ cursor: "pointer" }} />} />;

interface SetEditOptionParams {
    index: number | null;
    data: FieldOption | null;
}
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

    const onEditOption = (option: FieldOption, optionIndex: number) => {
        return setEditOption({ index: optionIndex, data: cloneDeep(option) });
    };

    return (
        <Bind name={"options"} validators={validation.create("required,minLength:1")}>
            {(bind: OptionsListBindParams) => {
                const {
                    validation: optionsValidation,
                    value: optionsValue,
                    onChange: setOptionsValue
                } = bind;

                // We are adding prop id to the list of options because SortableContext requires it.
                // SortableContext needs to have an id in order to make "sort" work.
                const optionsValueWithId: FieldOptionWithId[] = optionsValue?.map(
                    (option, index) => ({
                        ...option,
                        id: (index += 1)
                    })
                );

                const onSubmit = (data: FieldOptionWithId): void => {
                    // We need to remove id prop from option before saving it in graphql,
                    // because we do not store id for option in graphql.
                    delete data.id;
                    const newValue = [...optionsValueWithId].map(option => {
                        delete option.id;
                        return option;
                    });

                    newValue.splice(editOption.index as number, 1, data);
                    setOptionsValue(newValue);
                    clearEditOption();
                };

                const onDragEnd = (event: DragEndEvent) => {
                    const { active, over } = event;

                    if (active.id === over?.id) {
                        return;
                    }

                    const oldIndex = optionsValueWithId.findIndex(
                        (option: FieldOptionWithId) => option.id === active.id
                    );
                    const newIndex = optionsValueWithId.findIndex(
                        (option: FieldOptionWithId) => option.id === over?.id
                    );

                    const sortedOptions = arrayMove(optionsValueWithId, oldIndex, newIndex).map(
                        option => {
                            delete option.id;

                            return option;
                        }
                    );
                    setOptionsValue(sortedOptions);
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
                            {Array.isArray(optionsValueWithId) && optionsValueWithId.length > 0 ? (
                                <>
                                    <SortableContainerContextProvider
                                        optionsValue={optionsValueWithId}
                                        onDragEnd={onDragEnd}
                                    >
                                        {optionsValueWithId.map((item, index) => (
                                            <OptionListItem key={`item-${index}`}>
                                                <OptionsListItem
                                                    dragHandle={<DragHandle />}
                                                    multiple={!!multiple}
                                                    option={item}
                                                    Bind={Bind}
                                                    editOption={() => onEditOption(item, index)}
                                                    deleteOption={() => {
                                                        const newValue = [...optionsValue];
                                                        newValue.splice(index, 1);
                                                        setOptionsValue(newValue);
                                                    }}
                                                />
                                            </OptionListItem>
                                        ))}
                                    </SortableContainerContextProvider>
                                </>
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