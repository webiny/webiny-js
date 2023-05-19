import React, { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { ButtonDefault, ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { ReactComponent as ConditionIcon } from "@material-symbols/svg-400/outlined/alt_route.svg";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as VisibilityIcon } from "@material-design-icons/svg/outlined/visibility.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { FieldSelect } from "~/components/Select/FieldSelect";
import { Accordion } from "~/components/common/Accordion";
import {
    SettingsWrapper,
    SettingsTitle,
    SettingsSubTitle,
    ButtonSecondaryStyled,
    ConditionFormWrapper,
    ConditionFormTitle,
    ConditionFormButtonsWrapper,
    ConditionFormSelectWrapper,
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

const AccordionsWrapper = styled.div`
    display: grid;
    row-gap: 4px;
    margin-top: 22px;
`;

const VisibilityIconWrapper = styled.div<{ isActive: boolean }>`
    width: 16px;
    height: 16px;
    background-color: ${props => (props.isActive ? "var(--mdc-theme-primary)" : "white")};
    border: 1px solid
        var(
            ${props =>
                props.isActive ? "--mdc-theme-primary" : "--mdc-theme-text-secondary-on-background"}
        );

    & > svg {
        fill: ${props =>
            props.isActive ? `white` : "var(--mdc-theme-text-secondary-on-background)"};
    }
`;

const VariantLabel = styled.div`
    position: absolute;
    right: 8px;
    top: 8px;
    font-weight: bold;
    color: var(--mdc-theme-text-secondary-on-background);
`;

type Condition = {
    field?: any;
    condition: string;
    value: string;
};

type Variant = {
    id: string;
    label: string;
    conditions: Condition[];
};

type BlockVariantSelectorProps = {
    sourceModelId: string;
    value: { variants: Variant[]; selectedId: string };
    onChange: (value: { variants: Variant[]; selectedId: string }) => void;
};

export const BlockVariantSelector: React.FC<BlockVariantSelectorProps> = ({
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
        // if (!field) {
        //     return;
        // }

        // let newFilters = [...value];
        // if (typeof editIndex !== "undefined") {
        //     newFilters[editIndex] = {
        //         field,
        //         condition: condition,
        //         value: conditionValue
        //     };
        // } else {
        //     newFilters = [
        //         ...newFilters,
        //         {
        //             field,
        //             condition: condition,
        //             value: conditionValue
        //         }
        //     ];
        // }

        // onChange(newFilters);
        handleCancelButton();
    }, [field, condition, conditionValue, editIndex]);

    const handleEditButton = useCallback(
        (index: number) => {
            // setCondition(value?.[index]?.condition);
            // setConditionValue(value?.[index]?.value);
            // setField(value?.[index]?.field);
            setEditIndex(index);
            setIsEditMode(true);
        },
        [value]
    );

    const handleDeleteButton = useCallback(
        (index: number) => {
            // const newArray = [...value];
            // newArray.splice(index, 1);
            // onChange(newArray);
            console.log(index);
        },
        [value]
    );

    const handleVisibilityButton = useCallback(
        (variantId: string) => {
            onChange({ variants: value.variants, selectedId: variantId });
        },
        [value]
    );

    const showValueField = condition !== "isSet" && condition !== "isNotSet";

    return (
        <SettingsWrapper>
            <SettingsTitle>Block variants</SettingsTitle>
            <SettingsSubTitle>
                Depending on the entry data display a different variant of this block.
            </SettingsSubTitle>
            {isEditMode ? (
                <ConditionFormWrapper>
                    <ConditionFormTitle>Condition</ConditionFormTitle>
                    <VariantLabel>{value?.variants?.[0]?.label || ""}</VariantLabel>
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
                <AccordionsWrapper>
                    {value.variants?.map((variant, index) => (
                        <Accordion
                            label={variant.label}
                            key={index}
                            actions={
                                <>
                                    <VisibilityIconWrapper
                                        isActive={variant.id === value.selectedId}
                                    >
                                        <VisibilityIcon
                                            width={16}
                                            height={16}
                                            onClick={() => handleVisibilityButton(variant.id)}
                                        />
                                    </VisibilityIconWrapper>
                                    <DeleteIcon
                                        width={18}
                                        height={18}
                                        onClick={() => handleDeleteButton(index)}
                                    />
                                </>
                            }
                            isSelected={variant.id === value.selectedId}
                        >
                            <>
                                {variant.conditions.map((variantCondition, index) => (
                                    <SettingsListItem key={index}>
                                        <div className="item-title">{`${variantCondition.field?.label} ${variantCondition.condition} ${variantCondition.value}`}</div>
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
                            </>
                        </Accordion>
                    ))}
                    <ButtonSecondaryStyled onClick={() => setIsEditMode(true)}>
                        <ButtonIcon icon={<ConditionIcon />} />
                        Add a variant
                    </ButtonSecondaryStyled>
                </AccordionsWrapper>
            )}
        </SettingsWrapper>
    );
};
