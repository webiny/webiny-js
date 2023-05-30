import React, { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";

import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { Switch } from "@webiny/ui/Switch";
import { ButtonDefault, ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";

import { ReactComponent as FilterIcon } from "@material-design-icons/svg/outlined/filter_alt.svg";
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
    smallSelectStyles,
    largeSelectStyles,
    SwitchWrapper
} from "./Settings.styles";

const filterConditionOptions = [
    { label: "Match all", value: "matchAll" },
    { label: "Match any", value: "matchAny" }
];

const options = [
    {
        type: "text",
        options: [
            { label: "In", value: "in" },
            { label: "Not", value: "not" },
            { label: "Not In", value: "not_in" },
            { label: "Contains", value: "contains" },
            { label: "Not Contains", value: "not_contains" }
        ]
    },
    {
        type: "long-text",
        options: [
            { label: "Contains", value: "contains" },
            { label: "Not Contains", value: "not_contains" }
        ]
    },
    {
        type: "rich-text",
        options: [{ label: "Empty", value: "empty" }]
    },
    {
        type: "number",
        options: [
            { label: "In", value: "in" },
            { label: "Not", value: "not" },
            { label: "Not In", value: "not_in" },
            { label: "Lower", value: "lt" },
            { label: "Lower or equal", value: "lte" },
            { label: "Greater", value: "gt" },
            { label: "Greater or equal", value: "gte" },
            { label: "Between", value: "between" },
            { label: "Not Between", value: "not_between" }
        ]
    },
    {
        type: "boolean",
        options: [{ label: "Not", value: "not" }]
    },
    {
        type: "datetime",
        options: [
            { label: "In", value: "in" },
            { label: "Not", value: "not" },
            { label: "Not In", value: "not_in" },
            { label: "Lower", value: "lt" },
            { label: "Lower or equal", value: "lte" },
            { label: "Greater", value: "gt" },
            { label: "Greater or equal", value: "gte" }
        ]
    },
    {
        type: "file",
        options: [{ label: "Empty", value: "empty" }]
    },
    {
        type: "ref",
        options: [
            { label: "Id", value: "id" },
            { label: "Id not", value: "id_not" },
            { label: "Id in", value: "id_in" },
            { label: "Id not in", value: "id_not_in" },
            { label: "Entry id", value: "entryId" },
            { label: "Entry not", value: "entryId_not" },
            { label: "Entry id in", value: "entryId_in" },
            { label: "Entry id not in", value: "entryId_not_in" }
        ]
    }
];

const FilterConditionSelectWrapper = styled.div`
    display: grid;
    align-items: center;
    grid-template-columns: 1fr 1fr;
    margin: 10px 0 10px 10px;
    font-size: 14px;
    color: var(--mdc-theme-text-secondary-on-background);
`;

const SwitchWrapperStyled = styled(SwitchWrapper)`
    margin-left: 10px;
`;

const findConditionLabel = (conditionValue: string, fieldType: string) => {
    const conditionOption = options
        .map(({ type, options }) => {
            if (type === fieldType) {
                return options;
            } else {
                return null;
            }
        })
        .filter(value => Boolean(value))
        .flat();

    return (
        conditionOption.find(option => option?.value === conditionValue)?.value || ""
    ).toLowerCase();
};

export type Filter = {
    path: string;
    condition: string;
    value: string;
};

type FilterFormProps = {
    sourceModelId: string;
    defaultValue?: Filter;
    onCancel: () => void;
    onSave: (value: Filter) => void;
};

type FilterConditions = {
    type: string;
    options: {
        label: string;
        value: string;
    }[];
};

const defaultFilterCondition = {
    type: "all",
    options: [
        { label: "In", value: "in" },
        { label: "Not In", value: "not_in" },
        { label: "Lower", value: "lt" },
        { label: "Lower or equal", value: "lte" },
        { label: "Greater", value: "gt" },
        { label: "Greater or equal", value: "gte" },
        { label: "Between", value: "between" },
        { label: "Not Between", value: "not_between" },
        { label: "Empty", value: "empty" },
        { label: "Contains", value: "contains" },
        { label: "Not Contains", value: "not_contains" },
        { label: "Id", value: "id" },
        { label: "Id not", value: "id_not" },
        { label: "Id in", value: "id_in" },
        { label: "Id not in", value: "id_not_in" },
        { label: "Entry id", value: "entryId" },
        { label: "Entry not", value: "entryId_not" },
        { label: "Entry id in", value: "entryId_in" },
        { label: "Entry id not in", value: "entryId_not_in" }
    ]
};

const booleanOptions = [
    {
        label: "True",
        value: "true"
    },
    {
        label: "False",
        value: "false"
    }
];

const FilterForm: React.FC<FilterFormProps> = ({
    sourceModelId,
    defaultValue,
    onCancel,
    onSave
}) => {
    const [path, setPath] = useState(defaultValue?.path || "");
    const { data: fieldData } = useDynamicField(sourceModelId, defaultValue?.path || "");

    const [conditionValue, setConditionValue] = useState(defaultValue?.value || "");
    const [filterConditions, setFilterConditions] =
        useState<FilterConditions>(defaultFilterCondition);

    const [condition, setCondition] = useState(
        defaultValue?.condition || filterConditions.options[0].value
    );

    const getFilterConditions = (fieldType: string) => {
        return options.map(({ type, options }) => {
            if (type === fieldType) {
                setFilterConditions({
                    type: fieldType === "datetime" ? "date" : fieldType,
                    options
                });
                return options;
            } else {
                return null;
            }
        });
    };

    React.useEffect(() => {
        getFilterConditions(fieldData?.type || "text");
    }, [fieldData]);

    const handlePathChange = useCallback((selectedPath: string, fieldType: string) => {
        setPath(selectedPath);
        getFilterConditions(fieldType);
    }, []);

    const handleConditionChange = useCallback((selectedCondition: string) => {
        setCondition(selectedCondition);
    }, []);

    const handleConditionValueChange = useCallback((selectedConditionValue: string) => {
        setConditionValue(selectedConditionValue);
    }, []);

    const handleSaveClick = useCallback(() => {
        onSave({
            path,
            condition,
            value: conditionValue
        });
    }, [path, condition, conditionValue]);

    const showField =
        filterConditions.type !== "boolean" &&
        filterConditions.type !== "file" &&
        filterConditions.type !== "rich-text";
    const showBooleanSelectFields =
        filterConditions.type === "boolean" ||
        filterConditions.type === "file" ||
        filterConditions.type === "rich-text";

    const generateSelectLabel = () => {
        if (filterConditions.type === "file" || filterConditions.type === "rich-text") {
            return "Is Empty";
        } else if (filterConditions.type === "boolean") {
            return "Is Not";
        } else {
            return "";
        }
    };

    return (
        <ConditionFormWrapper>
            <ConditionFormTitle>Condition</ConditionFormTitle>
            <FieldSelect sourceModelId={sourceModelId} value={path} onChange={handlePathChange} />
            {path && (
                <>
                    <ConditionFormSelectWrapper>
                        <span className="select-title">Condition:</span>
                        <Select
                            label={generateSelectLabel()}
                            placeholder="Select"
                            value={condition}
                            onChange={handleConditionChange}
                            className={largeSelectStyles}
                        >
                            {filterConditions.options.map(
                                (option: { label: string; value: string }, index: number) => (
                                    <option key={index} value={option.value}>
                                        {option.label}
                                    </option>
                                )
                            )}
                        </Select>
                    </ConditionFormSelectWrapper>
                    {showField && (
                        <Input
                            type={filterConditions.type}
                            label="Enter value"
                            value={conditionValue}
                            onChange={handleConditionValueChange}
                        />
                    )}
                    {showBooleanSelectFields && (
                        <Select
                            label="Select value"
                            value={conditionValue}
                            onChange={handleConditionValueChange}
                        >
                            {booleanOptions.map(({ label, value }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </Select>
                    )}
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

type FilterItemProps = {
    index: number;
    sourceModelId: string;
    filter: Filter;
    onEditClick: (index: number) => void;
    onDeleteClick: (index: number) => void;
};

const FilterItem: React.FC<FilterItemProps> = ({
    index,
    sourceModelId,
    filter,
    onEditClick,
    onDeleteClick
}) => {
    const { data: fieldData } = useDynamicField(sourceModelId, filter.path);

    return (
        <SettingsListItemWrapper>
            <div className="item-title">{`${fieldData?.label || "..."} ${findConditionLabel(
                filter.condition,
                fieldData?.type || ""
            )} ${filter.value}`}</div>
            <div className="item-buttons">
                <EditIcon width={18} height={18} onClick={() => onEditClick(index)} />
                <DeleteIcon width={18} height={18} onClick={() => onDeleteClick(index)} />
            </div>
        </SettingsListItemWrapper>
    );
};

type FilterSettingsValue = {
    filters?: Filter[];
    filterCondition?: string;
    excludeCurrent?: boolean;
};

type FilterSettingsProps = {
    sourceModelId: string;
    value?: FilterSettingsValue;
    showExcludeCurrentEntry?: boolean;
    onChange: (value: FilterSettingsValue) => void;
};

export const FilterSettings: React.FC<FilterSettingsProps> = ({
    sourceModelId,
    value,
    showExcludeCurrentEntry,
    onChange
}) => {
    const filters = value?.filters || [];
    const filterCondition = value?.filterCondition || filterConditionOptions[0].value;
    const excludeCurrent = value?.excludeCurrent || false;
    const [isEditMode, setIsEditMode] = useState(false);
    const [editIndex, setEditIndex] = useState<number>();
    const formDefaultValue = typeof editIndex !== "undefined" ? filters[editIndex] : undefined;

    const handleCancelClick = useCallback(() => {
        setEditIndex(undefined);
        setIsEditMode(false);
    }, []);

    useEffect(() => {
        handleCancelClick();
    }, [sourceModelId]);

    const handleSaveClick = useCallback(
        ({ path, condition, value }) => {
            if (!path) {
                return;
            }

            let newFilters = [...filters];
            if (typeof editIndex !== "undefined") {
                newFilters[editIndex] = {
                    path,
                    condition,
                    value
                };
            } else {
                newFilters = [
                    ...newFilters,
                    {
                        path,
                        condition,
                        value
                    }
                ];
            }
            onChange({ filters: newFilters, filterCondition });
            handleCancelClick();
        },
        [filters, editIndex, filterCondition]
    );

    const handleEditClick = useCallback((index: number) => {
        setEditIndex(index);
        setIsEditMode(true);
    }, []);

    const handleDeleteClick = useCallback(
        (index: number) => {
            const newArray = [...filters];
            newArray.splice(index, 1);
            onChange({
                filters: newArray,
                ...(index > 0 ? { filterCondition } : {})
            });
        },
        [filters, filterCondition]
    );

    const handleFilterConditionSelect = useCallback(
        selectedFilterCondition => {
            onChange({ filters, filterCondition: selectedFilterCondition });
        },
        [filters]
    );

    const handleExcludeCurrentSwitch = useCallback(
        selectedExcludeCurrent => {
            onChange({ filters, excludeCurrent: selectedExcludeCurrent });
        },
        [filters]
    );

    return (
        <SettingsWrapper>
            <SettingsTitle>Filter Records:</SettingsTitle>
            <SettingsSubTitle>
                Only entries matching the following filter will be displayed:
            </SettingsSubTitle>
            {isEditMode ? (
                <FilterForm
                    sourceModelId={sourceModelId}
                    defaultValue={formDefaultValue}
                    onCancel={handleCancelClick}
                    onSave={handleSaveClick}
                />
            ) : (
                <>
                    {filters.length > 0 && (
                        <>
                            <SettingsList>
                                {filters.map((filter, index) => (
                                    <FilterItem
                                        key={index}
                                        index={index}
                                        sourceModelId={sourceModelId}
                                        filter={filter}
                                        onEditClick={handleEditClick}
                                        onDeleteClick={handleDeleteClick}
                                    />
                                ))}
                            </SettingsList>
                            <FilterConditionSelectWrapper>
                                Filter condition:
                                <Select
                                    value={filterCondition}
                                    onChange={handleFilterConditionSelect}
                                    className={smallSelectStyles}
                                >
                                    {filterConditionOptions.map((option, index) => (
                                        <option key={index} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                            </FilterConditionSelectWrapper>
                            {showExcludeCurrentEntry && (
                                <SwitchWrapperStyled>
                                    Exclude current entry:
                                    <Switch
                                        value={excludeCurrent}
                                        onChange={handleExcludeCurrentSwitch}
                                    />
                                </SwitchWrapperStyled>
                            )}
                        </>
                    )}
                    <ButtonSecondaryStyled onClick={() => setIsEditMode(true)}>
                        <ButtonIcon icon={<FilterIcon />} />
                        Add a filter
                    </ButtonSecondaryStyled>
                </>
            )}
        </SettingsWrapper>
    );
};
