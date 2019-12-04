// @flow
// $FlowFixMe
import React, { useState } from "react";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { css } from "emotion";
import styled from "@emotion/styled";
import { camelCase, cloneDeep } from "lodash";
import { OptionsListItem, AddOptionInput, EditFieldOptionDialog } from "./OptionsListComponents";
import { sortableContainer, sortableElement, sortableHandle } from "react-sortable-hoc";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as HandleIcon } from "@webiny/app-forms/admin/icons/round-drag_indicator-24px.svg";
import { validation } from "@webiny/validation";

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
    '&:last-child':{
        border: 'none'
    }
});

const sortableList = css({
    zIndex: 20
});

const DragHandle = sortableHandle(() => (
    <Icon icon={<HandleIcon style={{ cursor: "pointer" }} />} />
));

const SortableContainer = sortableContainer(({ children }) => {
    return <OptionList>{children}</OptionList>;
});

const SortableItem = sortableElement(
    ({
        setOptionsValue,
        setEditOption,
        option,
        optionsValue: options,
        Bind,
        multiple,
        optionIndex
    }) => (
        <OptionListItem>
            <OptionsListItem
                dragHandle={<DragHandle />}
                key={option.value}
                Bind={Bind}
                multiple={multiple}
                option={option}
                deleteOption={() => {
                    const newValue = [...options];
                    newValue.splice(optionIndex, 1);
                    setOptionsValue(newValue);
                }}
                editOption={() => setEditOption({ index: optionIndex, data: cloneDeep(option) })}
                setOptionTranslations={label => {
                    const newValue = [...options];
                    newValue.splice(optionIndex, 1, {
                        value: option.value,
                        label
                    });
                    setOptionsValue(newValue);
                }}
            />
        </OptionListItem>
    )
);

const OptionsList = ({ form, multiple }: Object) => {
    const { Bind } = form;

    const { getDefaultLocale } = useI18N();

    const [editOption, setEditOption] = useState({
        data: null,
        index: null
    });
    const clearEditOption = () =>
        setEditOption({
            data: null,
            index: null
        });

    return (
        <Bind name={"options"} validators={validation.create("required,minLength:2")}>
            {({
                validation: optionsValidation,
                value: optionsValue,
                onChange: setOptionsValue
            }) => (
                <>
                    <div>Options</div>
                    <div>
                        <AddOptionInput
                            options={optionsValue}
                            validation={optionsValidation}
                            onAdd={label => {
                                const newValue = Array.isArray(optionsValue)
                                    ? [...optionsValue]
                                    : [];
                                newValue.push({
                                    value: camelCase(label),
                                    label: {
                                        values: [{ locale: getDefaultLocale().id, value: label }]
                                    }
                                });
                                setOptionsValue(newValue);
                            }}
                        />
                    </div>

                    <div style={{ position: "relative" }}>
                        {Array.isArray(optionsValue) && optionsValue.length > 0 ? (
                            <SortableContainer
                                helperClass={sortableList}
                                useDragHandle
                                transitionDuration={0}
                                onSortEnd={({ oldIndex, newIndex }) => {
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
                        open={editOption.data}
                        options={optionsValue}
                        option={editOption.data}
                        optionIndex={editOption.index}
                        onSubmit={data => {
                            const newValue = [...optionsValue];
                            newValue.splice(editOption.index, 1, data);
                            setOptionsValue(newValue);
                            clearEditOption();
                        }}
                    />
                </>
            )}
        </Bind>
    );
};

export default OptionsList;
