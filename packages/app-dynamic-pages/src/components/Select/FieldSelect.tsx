import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";

import { plugins } from "@webiny/plugins";
import { Icon } from "@webiny/ui/Icon";
import { Menu } from "@webiny/ui/Menu";
import { CmsModelFieldTypePlugin } from "@webiny/app-headless-cms/types";

import { ReactComponent as ArrowDownIcon } from "@material-design-icons/svg/round/arrow_drop_down.svg";
import { ReactComponent as ArrowRightIcon } from "@material-design-icons/svg/round/keyboard_arrow_right.svg";
import { ReactComponent as ArrowBackIcon } from "@material-design-icons/svg/round/arrow_circle_up.svg";
import { ReactComponent as DataBaseIcon } from "@material-symbols/svg-400/rounded/database.svg";

import { useDynamicField } from "~/hooks/useDynamicField";
import { useDynamicFieldNesting } from "~/hooks/useDynamicFieldNesting";
import { Loader } from "~/components/common/Loader";
import {
    DropDownGroupHeading,
    DropDownOption,
    DropDownOptionWrapper,
    DropDownOptionIcon,
    DropDownOptions,
    DropDownOptionSubTitle,
    DropDownOptionTextContent,
    DropDownOptionTitle,
    DropDownMenu,
    LoaderWrapper,
    OpenNestedFieldsButton
} from "./Select.styles";

const DropDownOptionLoader = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

const MenuWrapper = styled.div`
    .mdc-menu-surface {
        width: 100%;
        max-height: 275px !important;
        top: 52px !important;
        box-shadow: none;
    }
`;

type MenuItemProps = {
    label: string;
    helpText?: string;
    icon: React.ReactElement;
    onClick: () => void;
    hasNestedFields: boolean;
    isActive?: boolean;
    setFilterField?: () => void;
    disabled?: boolean;
};

const useDisableField = ({
    field,
    hasNestedFields,
    allowedFields
}: {
    field: Record<any, any>;
    hasNestedFields: boolean;
    allowedFields?: string[];
}) => {
    if (allowedFields === undefined) {
        return false;
    }
    const fieldAcceptable = allowedFields?.find((type: string) => {
        if (type === "file:image") {
            return field?.settings?.imagesOnly;
        }
        if (type === "onlyDirectFields") {
            return !hasNestedFields;
        }
        return type.includes(field.type);
    });
    return fieldAcceptable === undefined;
};

const MenuItem: React.FC<MenuItemProps> = ({
    label,
    helpText,
    icon,
    onClick,
    hasNestedFields,
    isActive,
    disabled
}) => {
    return (
        <DropDownOptionWrapper onClick={onClick} isActive={isActive} disabled={disabled}>
            <DropDownOption>
                <DropDownOptionIcon>
                    <Icon icon={icon as React.ReactElement} />
                </DropDownOptionIcon>
                <DropDownOptionTextContent>
                    <DropDownOptionTitle>{label}</DropDownOptionTitle>
                    <DropDownOptionSubTitle>{helpText}</DropDownOptionSubTitle>
                </DropDownOptionTextContent>
                {hasNestedFields && (
                    <OpenNestedFieldsButton>
                        <Icon icon={<ArrowRightIcon width={20} height={20} />} />
                    </OpenNestedFieldsButton>
                )}
            </DropDownOption>
        </DropDownOptionWrapper>
    );
};

const resolveFieldPlugin = (type: string) => {
    const fieldPlugins = plugins.byType<CmsModelFieldTypePlugin>("cms-editor-field-type");
    return fieldPlugins.find(plugin => plugin.field.type === type);
};

type FieldSelectProps = {
    sourceModelId: string;
    value: string;
    onChange: (path: string, fieldType: string) => void;
    isSort?: boolean;
    allowedFields?: string[];
};

export const FieldSelect: React.FC<FieldSelectProps> = ({
    sourceModelId,
    value,
    onChange,
    allowedFields
}) => {
    const { data: selectedField } = useDynamicField(sourceModelId, value);
    const { data: initialNesting, loading: initialLoading } = useDynamicFieldNesting(
        sourceModelId,
        value
    );
    const [path, setPath] = useState<string>("");
    const { data: nesting, loading: nestingLoading } = useDynamicFieldNesting(sourceModelId, path);
    const latestNesting = nesting && nesting[nesting.length - 1];

    const selectLabel = useMemo(() => {
        if (
            initialNesting?.length === 1 &&
            initialNesting[initialNesting.length - 1].selectedField?.label
        ) {
            return initialNesting[initialNesting.length - 1].selectedField?.label;
        }

        if (initialNesting?.length === 2) {
            return `${initialNesting[initialNesting.length - 1].name} > ${
                initialNesting[initialNesting.length - 1].selectedField?.label
            }`;
        }

        if (initialNesting && initialNesting?.length > 2) {
            return `${initialNesting[1].name} > ... > ${
                initialNesting[initialNesting.length - 1].selectedField?.label
            }`;
        }

        return "Select a field";
    }, [initialNesting]);

    const createInitialPath = useCallback(() => {
        setPath(
            initialNesting
                ?.map(nestingItem => nestingItem.pathPart)
                ?.slice(0, -1)
                ?.join(".") || ""
        );
    }, [path, initialNesting]);

    useEffect(() => {
        if (path === "") {
            createInitialPath();
        }
    }, [initialNesting]);

    const handleSelect = useCallback(
        (fieldId: string, fieldType: string) => {
            if (path === "") {
                onChange(fieldId, fieldType);
            } else {
                onChange(path.concat(".", fieldId), fieldType);
            }
        },
        [path]
    );

    const handleSelectNested = useCallback(
        (fieldId: string) => {
            if (path === "") {
                setPath(fieldId);
            } else {
                setPath(path.concat(".", fieldId));
            }
        },
        [path]
    );

    const handleBackClick = useCallback(() => {
        const lastIndex = path.lastIndexOf(".");
        setPath(path.substring(0, lastIndex));
    }, [path]);

    return (
        <MenuWrapper>
            <Menu
                handle={
                    <DropDownMenu disabled={initialLoading}>
                        <Icon className="db-icon" icon={<DataBaseIcon width={24} height={24} />} />
                        <div className="label-wrapper">
                            <div className="label">{selectLabel}</div>
                        </div>
                        {initialLoading && (
                            <LoaderWrapper>
                                <Loader />
                            </LoaderWrapper>
                        )}
                        <Icon className="arrow-down" icon={<ArrowDownIcon />} />
                    </DropDownMenu>
                }
            >
                {({ closeMenu }: { closeMenu: () => void }) => {
                    return (
                        <>
                            <DropDownGroupHeading>
                                <Icon
                                    icon={<ArrowBackIcon width={20} height={20} />}
                                    className={`arrow-back-icon ${
                                        nesting && nesting.length > 1 && "active"
                                    }`}
                                    onClick={handleBackClick}
                                />
                                <span>
                                    {nesting?.map(({ name }, index) => {
                                        if (index === 0) {
                                            return name;
                                        }

                                        return ` > ${name}`;
                                    })}
                                </span>
                            </DropDownGroupHeading>
                            <DropDownOptions>
                                {nestingLoading ? (
                                    <DropDownOption>
                                        <DropDownOptionLoader>
                                            <Loader size={34} spinnerWidth={2} />
                                        </DropDownOptionLoader>
                                    </DropDownOption>
                                ) : (
                                    <>
                                        {latestNesting?.fields?.map((field, index) => {
                                            const fieldPlugin = resolveFieldPlugin(field.type);
                                            const hasNestedFields = Boolean(
                                                fieldPlugin?.field?.getChildFields
                                            );

                                            const disableField = useDisableField({
                                                field,
                                                allowedFields,
                                                hasNestedFields
                                            });

                                            const triggerHandler = () => {
                                                if (hasNestedFields) {
                                                    setTimeout(() =>
                                                        handleSelectNested(field.fieldId)
                                                    );
                                                } else {
                                                    handleSelect(field.fieldId, field.type);
                                                    closeMenu();
                                                }
                                            };

                                            const handleOnClick = () => {
                                                if (!disableField) {
                                                    triggerHandler();
                                                }
                                            };

                                            const currentPath = path
                                                ? `${path}.${field.fieldId}`
                                                : field.fieldId;

                                            return (
                                                <MenuItem
                                                    key={index}
                                                    label={field.label || ""}
                                                    helpText={field.helpText}
                                                    icon={
                                                        fieldPlugin?.field
                                                            .icon as React.ReactElement
                                                    }
                                                    onClick={handleOnClick}
                                                    hasNestedFields={hasNestedFields}
                                                    isActive={
                                                        currentPath === value &&
                                                        selectedField?.fieldId === field.fieldId
                                                    }
                                                    disabled={disableField || false}
                                                />
                                            );
                                        })}
                                        {latestNesting?.templates?.map((template, index) => {
                                            const triggerHandler = () => {
                                                setTimeout(() =>
                                                    handleSelectNested(template.gqlTypeName)
                                                );
                                            };

                                            return (
                                                <MenuItem
                                                    key={index}
                                                    label={template.name}
                                                    icon={<DataBaseIcon />}
                                                    onClick={triggerHandler}
                                                    hasNestedFields
                                                />
                                            );
                                        })}
                                    </>
                                )}
                            </DropDownOptions>
                        </>
                    );
                }}
            </Menu>
        </MenuWrapper>
    );
};
