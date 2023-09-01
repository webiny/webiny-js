import React, { useCallback, useRef, useState, useMemo, useEffect } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
// import groupBy from "lodash/groupBy";
import { Grid } from "react-virtualized";
import { GridCellProps } from "react-virtualized/dist/es/Grid";

import { Menu } from "@webiny/ui/Menu";
import { Tab, Tabs, TabsImperativeApi } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { FormComponentProps } from "@webiny/ui/types";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { Input } from "@webiny/ui/Input";
import { ColorPicker } from "@webiny/ui/ColorPicker";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";

import { IconRenderer, Icon } from "./IconRenderer";
import { useIconPickerConfig, IconPickerWithConfig } from "./config";
import { SkinToneSelect } from "./SkinToneSelect";

const COLUMN_COUNT = 8;

const IconPickerWrapper = styled.div`
    .mdc-menu-surface {
        overflow: visible !important;
    }
`;

const iconPickerLabel = css`
    margin-bottom: 5px;
    margin-left: 2px;
`;

const IconPickerInput = styled.div`
    background-color: ${props => props.theme.styles.colors.color5};
    border-bottom: 1px solid ${props => props.theme.styles.colors.color3};
    padding: 8px;
    height: 32px;
    width: fit-content;
    cursor: pointer;
    :hover {
        border-bottom: 1px solid ${props => props.theme.styles.colors.color3};
    }
`;

const MenuHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-transform: uppercase;
    padding: 12px;
    border-bottom: 1px solid ${props => props.theme.styles.colors.color5};
    color: ${props => props.theme.styles.colors.color4};

    & > svg {
        cursor: pointer;
        fill: ${props => props.theme.styles.colors.color4};
    }
`;

const Cell = styled.div<{ color: string; isActive: boolean }>`
    cursor: pointer;
    color: ${({ color }) => color};
    background-color: ${({ isActive, theme }) =>
        isActive ? theme.styles.colors.color5 : theme.styles.colors.color6};

    & > * {
        padding: 4px;
    }
`;

const TabContentWrapper = styled.div`
    width: 340px;
    padding: 12px;
`;

const NoResultsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
`;

const InputsWrapper = styled.div`
    display: flex;
    column-gap: 12px;
    padding-bottom: 12px;
    height: 40px;

    [class$="color"] {
        height: 24px;
        width: 24px;
        margin: 3px;
        border-radius: 50%;
    }

    [class$="classNames"] {
        display: none;
    }

    .webiny-ui-input {
        height: 40px !important;
    }
`;

type TabContentProps = {
    icons: Icon[];
    type: string;
    value: Icon;
    onChange: (value: Icon, closeMenu?: boolean) => void;
};

const TabContent = ({ icons, type, value, onChange }: TabContentProps) => {
    const [filter, setFilter] = useState("");
    const [color, setColor] = useState(value.color || "#0000008a");

    const onColorChange = useCallback((newColor: string) => {
        setColor(newColor);
    }, []);

    const onFilterChange = useCallback(
        (value, cb) => {
            setFilter(value);
            cb();
        },
        [filter]
    );

    useEffect(() => {
        if (value.type === "icon" && value.color !== color) {
            onChange({ ...value, color, skinTone: undefined }, false);
        }
    }, [color]);

    const filteredIcons = useMemo(() => {
        return filter ? icons.filter(ic => ic.name.includes(filter)) : icons;
    }, [filter, icons]);

    const renderCell = useCallback(() => {
        return function renderCell({
            columnIndex,
            key,
            rowIndex,
            style
        }: GridCellProps): React.ReactNode {
            const item = filteredIcons[rowIndex * COLUMN_COUNT + columnIndex];
            if (!item) {
                return null;
            }

            return (
                <Cell
                    key={key}
                    style={style}
                    onClick={() => {
                        onChange({
                            type: item.type,
                            name: item.name,
                            ...(item.type === "emoji" ? { skinTone: item.skinTone } : {}),
                            ...(item.type === "icon" ? { color } : {}),
                            ...(item.width ? { width: item.width } : {}),
                            value: item.value
                        });
                    }}
                    color={color}
                    isActive={item.name === value.name}
                >
                    <IconRenderer icon={item} size={32} />
                </Cell>
            );
        };
    }, [filteredIcons, color]);

    return (
        <TabContentWrapper>
            <InputsWrapper>
                <DelayedOnChange value={filter} onChange={onFilterChange}>
                    {({ value, onChange }) => (
                        <Input value={value} onChange={onChange} placeholder={"Search icons..."} />
                    )}
                </DelayedOnChange>
                {type === "emoji" && (
                    <SkinToneSelect emojis={icons} icon={value} onChange={onChange} />
                )}
                {type === "icon" && (
                    <DelayedOnChange value={color} onChange={onColorChange}>
                        {({ value, onChange }) => <ColorPicker value={value} onChange={onChange} />}
                    </DelayedOnChange>
                )}
            </InputsWrapper>
            {filteredIcons.length === 0 ? (
                <NoResultsWrapper>
                    <Typography use="body1">No results found.</Typography>
                </NoResultsWrapper>
            ) : (
                <Grid
                    cellRenderer={renderCell()}
                    columnCount={COLUMN_COUNT}
                    columnWidth={40}
                    height={400}
                    rowCount={Math.ceil(filteredIcons.length / COLUMN_COUNT)}
                    rowHeight={40}
                    width={340}
                />
            )}
        </TabContentWrapper>
    );
};

export interface IconPickerProps extends FormComponentProps {
    label?: string;
    description?: string;
}

const IconPicker = ({ value, onChange, validation, label, description }: IconPickerProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};

    const tabsRef = useRef<TabsImperativeApi>();
    const { icons } = useIconPickerConfig();

    // const emojisByCategory = groupBy(
    //     icons.filter(icon => icon.type === "emoji"),
    //     "category"
    // );
    const emojis = icons.filter(icon => icon.type === "emoji");
    const defaultIcons = icons.filter(icon => icon.type === "icon");

    const onIconChange = useCallback(
        (icon: Icon) => {
            if (onChange) {
                onChange(icon);
            }
        },
        [onChange]
    );

    const handleSwitchTab = useCallback(() => {
        if (!tabsRef.current) {
            return;
        }

        switch (value.type) {
            case "icon":
                tabsRef.current.switchTab(0);
                break;
            case "emoji":
                tabsRef.current.switchTab(1);
                break;
            case "custom":
                tabsRef.current.switchTab(2);
                break;
        }
    }, [value.type, tabsRef]);

    return (
        <IconPickerWrapper>
            {label && (
                <div className={iconPickerLabel}>
                    <Typography use={"body1"}>{label}</Typography>
                </div>
            )}

            <Menu
                handle={
                    <IconPickerInput>
                        <IconRenderer icon={value} />
                    </IconPickerInput>
                }
                onOpen={handleSwitchTab}
            >
                {({ closeMenu }: { closeMenu: () => void }) => (
                    <>
                        <MenuHeader>
                            <Typography use={"body1"}>Select an icon</Typography>
                            <CloseIcon onClick={() => closeMenu()} />
                        </MenuHeader>
                        <Tabs ref={tabsRef}>
                            <Tab label={"Icons"}>
                                <TabContent
                                    icons={defaultIcons}
                                    type="icon"
                                    value={value}
                                    onChange={onIconChange}
                                />
                            </Tab>
                            <Tab label={"Emojis"}>
                                <TabContent
                                    icons={emojis}
                                    type="emoji"
                                    value={value}
                                    onChange={onIconChange}
                                />
                            </Tab>
                            <Tab label={"Custom"}>
                                <TabContent
                                    icons={[]}
                                    type="custom"
                                    value={value}
                                    onChange={onIconChange}
                                />
                            </Tab>
                        </Tabs>
                    </>
                )}
            </Menu>

            {validationIsValid === false && (
                <FormElementMessage error>{validationMessage}</FormElementMessage>
            )}
            {validationIsValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </IconPickerWrapper>
    );
};

const IconPickerComponent = (props: IconPickerProps) => {
    return (
        <>
            <IconPickerWithConfig>
                <IconPicker {...props} />
            </IconPickerWithConfig>
        </>
    );
};

IconPickerComponent.Icon = IconRenderer;

export { IconPickerComponent as IconPicker };
