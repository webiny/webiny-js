import React, { useCallback, useEffect, useState } from "react";

import { Select } from "@webiny/ui/Select";
import { ButtonDefault, ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";

import { ReactComponent as SortIcon } from "@material-design-icons/svg/outlined/sort_by_alpha.svg";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";

import { useDynamicField } from "~/hooks/useDynamicField";
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
    SettingsListItem as SettingsListItemWrapper,
    largeSelectStyles
} from "./Settings.styles";

const directionOptions = [
    { label: "Ascending", value: "ASC" },
    { label: "Descending", value: "DESC" }
];

export type SortRule = {
    path: string;
    direction: string;
};

type SortRuleFormProps = {
    sourceModelId: string;
    defaultValue?: SortRule;
    onCancel: () => void;
    onSave: (value: SortRule) => void;
};

const SortRuleForm: React.FC<SortRuleFormProps> = ({
    sourceModelId,
    defaultValue,
    onCancel,
    onSave
}) => {
    const [path, setPath] = useState(defaultValue?.path || "");
    const [direction, setDirection] = useState(
        defaultValue?.direction || directionOptions[0].value
    );

    const handlePathChange = useCallback((selectedPath: string) => {
        setPath(selectedPath);
    }, []);

    const handleDirectionChange = useCallback((selectedDirection: string) => {
        setDirection(selectedDirection);
    }, []);

    const handleSaveClick = useCallback(() => {
        onSave({
            path,
            direction
        });
    }, [path, direction]);

    return (
        <ConditionFormWrapper>
            <ConditionFormTitle>Condition</ConditionFormTitle>
            <FieldSelect
                sourceModelId={sourceModelId}
                value={path}
                onChange={handlePathChange}
                allowedFields={["onlyDirectFields"]}
            />
            {path && (
                <>
                    <ConditionFormSelectWrapper>
                        <span className="select-title">Direction:</span>
                        <Select
                            value={direction}
                            onChange={handleDirectionChange}
                            className={largeSelectStyles}
                        >
                            {directionOptions.map((option, index) => (
                                <option key={index} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </ConditionFormSelectWrapper>
                </>
            )}
            <ConditionFormButtonsWrapper>
                <ButtonDefault onClick={onCancel}>Cancel</ButtonDefault>
                <ButtonSecondary onClick={handleSaveClick} disabled={!path}>
                    Save
                </ButtonSecondary>
            </ConditionFormButtonsWrapper>
        </ConditionFormWrapper>
    );
};

type SortRuleItemProps = {
    index: number;
    sourceModelId: string;
    sortRule: SortRule;
    onEditClick: (index: number) => void;
    onDeleteClick: (index: number) => void;
};

const SortRuleItem: React.FC<SortRuleItemProps> = ({
    index,
    sortRule,
    sourceModelId,
    onEditClick,
    onDeleteClick
}) => {
    const { data: fieldData } = useDynamicField(sourceModelId, sortRule.path);

    return (
        <SettingsListItemWrapper>
            <div className="item-title">{`${fieldData?.label || "..."} ${sortRule.direction}`}</div>
            <div className="item-buttons">
                <EditIcon width={18} height={18} onClick={() => onEditClick(index)} />
                <DeleteIcon width={18} height={18} onClick={() => onDeleteClick(index)} />
            </div>
        </SettingsListItemWrapper>
    );
};

type SortRuleSettingsProps = {
    sourceModelId: string;
    value: SortRule[];
    onChange: (sortRules: SortRule[]) => void;
};

export const SortRuleSettings: React.FC<SortRuleSettingsProps> = ({
    sourceModelId,
    value,
    onChange
}) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editIndex, setEditIndex] = useState<number>();
    const formDefaultValue = typeof editIndex !== "undefined" ? value[editIndex] : undefined;

    const handleCancelClick = useCallback(() => {
        setEditIndex(undefined);
        setIsEditMode(false);
    }, []);

    useEffect(() => {
        handleCancelClick();
    }, [sourceModelId]);

    const handleSaveClick = useCallback(
        ({ path, direction }) => {
            if (!path) {
                return;
            }

            let newSortRules = [...value];
            if (typeof editIndex !== "undefined") {
                newSortRules[editIndex] = {
                    path,
                    direction
                };
            } else {
                newSortRules = [
                    ...newSortRules,
                    {
                        path,
                        direction
                    }
                ];
            }

            onChange(newSortRules);
            handleCancelClick();
        },
        [value, editIndex]
    );

    const handleEditClick = useCallback((index: number) => {
        setEditIndex(index);
        setIsEditMode(true);
    }, []);

    const handleDeleteClick = useCallback(
        (index: number) => {
            const newArray = [...value];
            newArray.splice(index, 1);
            onChange(newArray);
        },
        [value]
    );

    return (
        <SettingsWrapper>
            <SettingsTitle>Sort records:</SettingsTitle>
            <SettingsSubTitle>Sort records based on the following rules:</SettingsSubTitle>
            {isEditMode ? (
                <SortRuleForm
                    sourceModelId={sourceModelId}
                    defaultValue={formDefaultValue}
                    onCancel={handleCancelClick}
                    onSave={handleSaveClick}
                />
            ) : (
                <>
                    {value.length > 0 && (
                        <SettingsList>
                            {value.map((sortRule, index) => (
                                <SortRuleItem
                                    key={index}
                                    index={index}
                                    sourceModelId={sourceModelId}
                                    sortRule={sortRule}
                                    onEditClick={handleEditClick}
                                    onDeleteClick={handleDeleteClick}
                                />
                            ))}
                        </SettingsList>
                    )}
                    <ButtonSecondaryStyled onClick={() => setIsEditMode(true)}>
                        <ButtonIcon icon={<SortIcon />} />
                        Add a sort rule
                    </ButtonSecondaryStyled>
                </>
            )}
        </SettingsWrapper>
    );
};
