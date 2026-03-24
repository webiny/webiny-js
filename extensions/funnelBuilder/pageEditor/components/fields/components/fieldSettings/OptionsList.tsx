import React from "react";
import camelCase from "lodash/camelCase";
import { OptionsListItem, SortableContainerContextProvider } from "./OptionsList/OptionsListItem";
import { AddOptionInput } from "./OptionsList/AddOptionInput";
import { FieldOption } from "./OptionsList/types";
import { Grid } from "webiny/admin/ui";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Bind, useBind, validation } from "webiny/admin/form";
import { getRandomId } from "../../../../../utils/getRandomId";

interface OptionsListProps {
    multiple?: boolean;
}

interface OptionsListBindParams {
    validation: any;
    value: FieldOption[];
    onChange: (values: FieldOption[]) => void;
}

const OptionsList = ({ multiple }: OptionsListProps) => {
    const {
        validation: optionsValidation,
        value: optionsValue,
        onChange: setOptionsValue
    } = useBind({
        name: "extra.options",
        validators: validation.create("required,minLength:1")
    }) as OptionsListBindParams;

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id === over?.id) {
            return;
        }

        const oldIndex = optionsValue.findIndex(option => option.id === active.id);
        const newIndex = optionsValue.findIndex(option => option.id === over?.id);

        const sortedOptions = arrayMove(optionsValue, oldIndex, newIndex);
        setOptionsValue(sortedOptions);
    };

    return (
        <>
            <div className={"font-bold text-sm mb-sm text-neutral-primary"}>Options</div>
            <Grid className={"mb-sm"}>
                <Grid.Column span={12}>
                    <AddOptionInput
                        options={optionsValue}
                        validation={optionsValidation}
                        onAdd={label => {
                            const newValue = Array.isArray(optionsValue) ? [...optionsValue] : [];
                            newValue.push({
                                id: getRandomId(),
                                value: camelCase(label),
                                label
                            });
                            setOptionsValue(newValue);
                        }}
                    />
                </Grid.Column>
            </Grid>

            <div>
                {Array.isArray(optionsValue) && optionsValue.length > 0 ? (
                    <SortableContainerContextProvider
                        optionsValue={optionsValue}
                        onDragEnd={onDragEnd}
                    >
                        {optionsValue.map((item, index) => (
                            <li
                                key={`item-${index}`}
                                className={
                                    "z-10 flex items-center justify-between border-b border-solid border-neutral-dimmed bg-neutral-base px-sm py-xs hover:bg-neutral-dimmed last:border-none"
                                }
                            >
                                <OptionsListItem
                                    multiple={!!multiple}
                                    option={item}
                                    Bind={Bind}
                                    deleteOption={() => {
                                        const newValue = [...optionsValue];
                                        newValue.splice(index, 1);
                                        setOptionsValue(newValue);
                                    }}
                                />
                            </li>
                        ))}
                    </SortableContainerContextProvider>
                ) : (
                    <div className={"p-xl text-center"}>No options added.</div>
                )}
            </div>
        </>
    );
};

export default OptionsList;
