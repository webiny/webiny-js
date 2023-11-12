import React, { useCallback, useEffect, useState } from "react";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { ButtonDefault, ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as ConditionIcon } from "@material-symbols/svg-400/outlined/family_history.svg";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { FieldSelect } from "~/components/Select/FieldSelect";
import {
    SettingsWrapper,
    SettingsTitle,
    SettingsSubTitle,
    ButtonSecondaryStyled,
    ConditionFormWrapper,
    ConditionFormTitle,
    ConditionFormButtonsWrapper,
    ConditionFormSelectWrapper,
    SettingsList,
    SettingsListItem,
    largeSelectStyles
} from "~/components/Settings/Settings.styles";

const conditionOptions = [
    { label: "Is set", value: "isSet" },
    { label: "Is not set", value: "isNotSet" },
    { label: "Equals", value: "equals" },
    { label: "Doesn't equal", value: "doesNotEqual" },
    { label: "Contains", value: "contains" },
    { label: "Doesn't contain", value: "doesNotContain" }
];

type Filter = {
    field?: any;
    condition: string;
    value: string;
};

type ConditionalVisibilitySelectorProps = {
    sourceModelId: string;
    value: Filter[];
    onChange: (value: Filter[]) => void;
};

export const ConditionalVisibilitySelector: React.FC<ConditionalVisibilitySelectorProps> = ({
    sourceModelId,
    value,
    onChange
}) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [field, setField] = useState<any>();
    const [condition, setCondition] = useState(conditionOptions[0].value);
    const [conditionValue, setConditionValue] = useState("");
    const [editIndex, setEditIndex] = useState<number>();

    const handleFieldChange = useCallback((selectedField: any) => {
        setField(selectedField);
    }, []);

    const handleCancelButton = useCallback(() => {
        setCondition(conditionOptions[0].value);
        setConditionValue("");
        setField(undefined);
        setEditIndex(undefined);
        setIsEditMode(false);
    }, []);

    useEffect(() => {
        handleCancelButton();
    }, [sourceModelId]);

    const handleConditionSelect = useCallback((selectedValue: string) => {
        setCondition(selectedValue);
        setConditionValue("");
    }, []);

    const handleSaveButton = useCallback(() => {
        if (!field) {
            return;
        }

        let newFilters = [...value];
        if (typeof editIndex !== "undefined") {
            newFilters[editIndex] = {
                field,
                condition: condition,
                value: conditionValue
            };
        } else {
            newFilters = [
                ...newFilters,
                {
                    field,
                    condition: condition,
                    value: conditionValue
                }
            ];
        }

        onChange(newFilters);
        handleCancelButton();
    }, [field, condition, conditionValue, editIndex]);

    const handleEditButton = useCallback(
        (index: number) => {
            setCondition(value?.[index]?.condition);
            setConditionValue(value?.[index]?.value);
            setField(value?.[index]?.field);
            setEditIndex(index);
            setIsEditMode(true);
        },
        [value]
    );

    const handleDeleteButton = useCallback(
        (index: number) => {
            const newArray = [...value];
            newArray.splice(index, 1);
            onChange(newArray);
        },
        [value]
    );

    const showValueField = condition !== "isSet" && condition !== "isNotSet";

    return (
        <SettingsWrapper>
            <SettingsTitle>Conditional visibility:</SettingsTitle>
            <SettingsSubTitle>
                The element will be visible only when the following conditions are met.
            </SettingsSubTitle>
            {isEditMode ? (
                <ConditionFormWrapper>
                    <ConditionFormTitle>Condition</ConditionFormTitle>
                    <FieldSelect
                        sourceModelId={sourceModelId}
                        value={field}
                        onChange={handleFieldChange}
                    />
                    {field && (
                        <>
                            <ConditionFormSelectWrapper>
                                <span className="select-title">Condition:</span>
                                <Select
                                    value={condition}
                                    onChange={handleConditionSelect}
                                    className={largeSelectStyles}
                                >
                                    {conditionOptions.map((option, index) => (
                                        <option key={index} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                            </ConditionFormSelectWrapper>
                            {showValueField && (
                                <Input
                                    label="Enter value"
                                    value={conditionValue}
                                    onChange={setConditionValue}
                                />
                            )}
                        </>
                    )}
                    <ConditionFormButtonsWrapper>
                        <ButtonDefault onClick={handleCancelButton}>Cancel</ButtonDefault>
                        <ButtonSecondary onClick={handleSaveButton} disabled={!field}>
                            Save
                        </ButtonSecondary>
                    </ConditionFormButtonsWrapper>
                </ConditionFormWrapper>
            ) : (
                <>
                    {value.length > 0 && (
                        <SettingsList>
                            {value.map((filter, index) => (
                                <SettingsListItem key={index}>
                                    <div className="item-title">{`${filter.field?.label} ${filter.condition} ${filter.value}`}</div>
                                    <div className="item-buttons">
                                        <EditIcon
                                            width={18}
                                            height={18}
                                            onClick={() => handleEditButton(index)}
                                        />
                                        <DeleteIcon
                                            width={18}
                                            height={18}
                                            onClick={() => handleDeleteButton(index)}
                                        />
                                    </div>
                                </SettingsListItem>
                            ))}
                        </SettingsList>
                    )}
                    <ButtonSecondaryStyled onClick={() => setIsEditMode(true)}>
                        <ButtonIcon icon={<ConditionIcon />} />
                        Add a condition
                    </ButtonSecondaryStyled>
                </>
            )}
        </SettingsWrapper>
    );
};
