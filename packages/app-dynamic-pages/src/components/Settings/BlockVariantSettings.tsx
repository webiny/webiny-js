import React, { useMemo, useState } from "react";
import styled from "@emotion/styled";
import get from "lodash/get";

import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { BindComponent } from "@webiny/form/types";

import { ReactComponent as ConditionIcon } from "@material-symbols/svg-400/outlined/alt_route.svg";
import { ReactComponent as VisibilityIcon } from "@material-design-icons/svg/outlined/visibility.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { ReactComponent as FilterIcon } from "@material-design-icons/svg/outlined/filter_alt.svg";

import { Accordion } from "~/components/common/Accordion";
import {
    ButtonSecondaryStyled,
    SettingsWrapper,
    SettingsTitle,
    SettingsSubTitle
} from "./Settings.styles";
import { PbElement } from "~/types";
import { Filter, FilterForm, FilterItem } from "./FilterSettings";

export const variantNames = ["A", "B", "C", "D", "E", "F", "G"];

const BlockVariantSettingsWrapper = styled.div`
    display: grid;
    row-gap: 24px;
    margin-top: -112px;
    padding: 16px 16px 200px 16px;
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

const AccordionsWrapper = styled.div`
    display: grid;
    row-gap: 4px;

    & > div:first-of-type {
        margin-top: 22px;
    }
`;

const AddFilterButton = styled(ButtonSecondary)`
    background-color: white !important;
    width: 100%;
`;

type BlockVariantSettingsProps = {
    Bind: BindComponent;
    submit: () => void;
    data: PbElement;
    sourceModelId: string;
    addVariant: () => void;
    removeVariant: (index: number) => void;
};

export const BlockVariantSettings: React.FC<BlockVariantSettingsProps> = ({
    Bind,
    submit,
    data,
    sourceModelId,
    addVariant,
    removeVariant
}) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editIndex, setEditIndex] = useState<{ variantIndex: number; conditionIndex: number }>();

    const variants: PbElement[] = useMemo(() => {
        return get(data, "elements", [])?.filter(element => element.data?.conditions);
    }, [data]);

    const selectedVariant = useMemo(() => {
        const id = get(data, "data.selectedVariantId");
        return variants.some(variant => variant.id === id) ? id : data.elements?.[0]?.id;
    }, [data, variants]);

    if (!sourceModelId || data?.type !== "block") {
        return null;
    }

    const canHaveMoreVariants = !variants || variants.length < variantNames.length;

    return (
        <BlockVariantSettingsWrapper>
            <SettingsWrapper>
                <SettingsTitle>Block variants:</SettingsTitle>
                <SettingsSubTitle>
                    Depending on the entry data display a different variant of this block.
                </SettingsSubTitle>
                {isEditMode ? (
                    <Bind
                        name={`elements[${editIndex?.variantIndex}].data.conditions[${editIndex?.conditionIndex}]`}
                        afterChange={() => {
                            submit();
                            setIsEditMode(false);
                        }}
                    >
                        {({ value, onChange }) => {
                            return (
                                <FilterForm
                                    sourceModelId={sourceModelId}
                                    defaultValue={value}
                                    onCancel={() => {
                                        setIsEditMode(false);
                                    }}
                                    onSave={onChange}
                                    label={`Variant: ${
                                        editIndex ? variantNames[editIndex.variantIndex] : ""
                                    }`}
                                />
                            );
                        }}
                    </Bind>
                ) : (
                    <>
                        <AccordionsWrapper>
                            {variants.map((variant, variantIndex) => (
                                <Accordion
                                    label={`Variant: ${variantNames[variantIndex]}`}
                                    key={variantIndex}
                                    actions={
                                        <>
                                            <VisibilityIconWrapper
                                                isActive={variant.id === selectedVariant}
                                            >
                                                <Bind
                                                    name={"data.selectedVariantId"}
                                                    afterChange={submit}
                                                >
                                                    {({ onChange }) => (
                                                        <VisibilityIcon
                                                            width={16}
                                                            height={16}
                                                            onClick={() => onChange(variant.id)}
                                                        />
                                                    )}
                                                </Bind>
                                            </VisibilityIconWrapper>
                                            <DeleteIcon
                                                width={18}
                                                height={18}
                                                onClick={() => {
                                                    removeVariant(variantIndex);
                                                }}
                                            />
                                        </>
                                    }
                                    isSelected={variant.id === selectedVariant}
                                >
                                    <Bind
                                        name={`elements[${variantIndex}].data.conditions`}
                                        afterChange={submit}
                                    >
                                        {({ value, onChange }) => (
                                            <>
                                                {(variant?.data?.conditions as Filter[])?.map(
                                                    (variantCondition, conditionIndex) => (
                                                        <FilterItem
                                                            key={conditionIndex}
                                                            index={conditionIndex}
                                                            sourceModelId={sourceModelId}
                                                            filter={variantCondition}
                                                            onEditClick={() => {
                                                                setEditIndex({
                                                                    variantIndex,
                                                                    conditionIndex
                                                                });
                                                                setIsEditMode(true);
                                                            }}
                                                            onDeleteClick={() => {
                                                                const newArray = [...value];
                                                                newArray.splice(conditionIndex, 1);
                                                                onChange(newArray);
                                                            }}
                                                        />
                                                    )
                                                )}
                                            </>
                                        )}
                                    </Bind>
                                    <AddFilterButton
                                        onClick={() => {
                                            setEditIndex({
                                                variantIndex,
                                                conditionIndex: variant.data.conditions.length
                                            });
                                            setIsEditMode(true);
                                        }}
                                    >
                                        <ButtonIcon icon={<FilterIcon />} />
                                        Add a filter
                                    </AddFilterButton>
                                </Accordion>
                            ))}
                        </AccordionsWrapper>
                        {canHaveMoreVariants && (
                            <ButtonSecondaryStyled onClick={addVariant}>
                                <ButtonIcon icon={<ConditionIcon />} />
                                Add a variant
                            </ButtonSecondaryStyled>
                        )}
                    </>
                )}
            </SettingsWrapper>
        </BlockVariantSettingsWrapper>
    );
};
