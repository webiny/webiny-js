import React, { useCallback, useRef, useState, useMemo, useEffect } from "react";
import groupBy from "lodash/groupBy";
import { List } from "react-virtualized";
import { useQuery } from "@apollo/react-hooks";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";

import { Menu } from "@webiny/ui/Menu";
import { ButtonSecondary } from "@webiny/ui/Button";
import { Tab, Tabs, TabsImperativeApi } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { DelayedOnChangeProps } from "@webiny/ui/DelayedOnChange/DelayedOnChange";
import { Input } from "@webiny/ui/Input";
import { ColorPicker } from "@webiny/ui/ColorPicker";
import { CircularProgress } from "@webiny/ui/Progress";
import { FormComponentProps } from "@webiny/ui/types";

import { FileManager } from "~/components";
import { IconRenderer, Icon } from "./IconRenderer";
import { useIconPickerConfig, IconPickerWithConfig } from "./config";
import { SkinToneSelect } from "./SkinToneSelect";
import {
    LIST_ICON_FILES,
    ListIconFilesQueryResponse
} from "~/components/IconPicker/config/graphql";
import {
    IconPickerWrapper,
    iconPickerLabel,
    IconPickerInput,
    MenuHeader,
    Row,
    Cell,
    CategoryLabel,
    TabContentWrapper,
    ListWrapper,
    NoResultsWrapper,
    InputsWrapper,
    addButtonStyle,
    placeholderIcon
} from "./IconPicker.styles";

const COLUMN_COUNT = 8;

type RenderRowProps = {
    index: number;
    key: string;
    style: Record<string, any>;
};

type TabContentProps = {
    icons: Icon[];
    type: string;
    value: Icon;
    onChange: (value: Icon, closeMenu?: boolean) => void;
    filter: string;
    onFilterChange: DelayedOnChangeProps["onChange"];
    refetchCustomIcons?: () => void;
    isLoading?: boolean;
};

const TabContent = ({
    icons,
    type,
    value,
    onChange,
    filter,
    onFilterChange,
    refetchCustomIcons,
    isLoading
}: TabContentProps) => {
    const [color, setColor] = useState(value.color || "#0000008a");

    const onColorChange = useCallback((newColor: string) => {
        setColor(newColor);
    }, []);

    useEffect(() => {
        if (value.type === "icon" && value.color !== color) {
            onChange({ ...value, color, skinTone: undefined }, false);
        }
    }, [color]);

    const filteredIcons = useMemo(() => {
        const hyphenUnderscoreRegex = /[-_]/g;

        return icons.filter(icon =>
            icon.name
                .replace(hyphenUnderscoreRegex, " ")
                .toLowerCase()
                .includes(filter.toLowerCase())
        );
    }, [filter, icons]);

    const rows = useMemo(() => {
        const groupedObjects = groupBy(filteredIcons, "category");
        const rows = [];

        for (const key in groupedObjects) {
            if (key !== "undefined") {
                const rowIcons = groupedObjects[key];

                rows.push([{ categoryName: key }]);

                while (rowIcons.length) {
                    rows.push(rowIcons.splice(0, COLUMN_COUNT));
                }
            }
        }

        if (groupedObjects.undefined) {
            const rowIcons = groupedObjects.undefined;

            rows.push([{ categoryName: "Uncategorized" }]);

            while (rowIcons.length) {
                rows.push(rowIcons.splice(0, COLUMN_COUNT));
            }
        }

        return rows;
    }, [filteredIcons]);

    const renderRow = useCallback(
        ({ index, key, style }: RenderRowProps) => {
            const currentRow = rows[index];
            const categoryName = (currentRow[0] as { categoryName: string }).categoryName;

            if (categoryName) {
                return (
                    <Row key={key} style={style}>
                        <CategoryLabel>{categoryName}</CategoryLabel>
                    </Row>
                );
            }

            return (
                <Row key={key} style={style}>
                    {(currentRow as Icon[]).map((item, itemKey) => (
                        <Cell
                            key={itemKey}
                            color={color}
                            isActive={item.name === value.name}
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
                        >
                            <IconRenderer icon={item} size={32} />
                        </Cell>
                    ))}
                </Row>
            );
        },
        [rows, color, value]
    );

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
                {type === "custom" && (
                    <FileManager
                        onUploadCompletion={([{ name, src }]) => {
                            onChange({
                                type: "custom",
                                name: name || "",
                                value: src
                            });
                        }}
                        onChange={({ name, src }) =>
                            onChange({
                                type: "custom",
                                name: name || "",
                                value: src
                            })
                        }
                        onClose={() => {
                            if (refetchCustomIcons) {
                                refetchCustomIcons();
                            }
                        }}
                        scope="scope:iconPicker"
                        accept={["image/svg+xml"]}
                    >
                        {({ showFileManager }) => (
                            <ButtonSecondary
                                className={addButtonStyle}
                                onClick={() => {
                                    showFileManager();
                                }}
                            >
                                Browse
                            </ButtonSecondary>
                        )}
                    </FileManager>
                )}
            </InputsWrapper>
            <ListWrapper>
                {isLoading && <CircularProgress />}
                {filteredIcons.length === 0 ? (
                    <NoResultsWrapper>
                        <Typography use="body1">No results found.</Typography>
                    </NoResultsWrapper>
                ) : (
                    <List
                        rowRenderer={renderRow}
                        height={400}
                        rowCount={rows.length}
                        rowHeight={40}
                        width={340}
                    />
                )}
            </ListWrapper>
        </TabContentWrapper>
    );
};

export interface IconPickerProps extends FormComponentProps {
    label?: string;
    description?: string;
}

const IconPicker = ({ value = {}, onChange, validation, label, description }: IconPickerProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};

    const [filter, setFilter] = useState("");
    const tabsRef = useRef<TabsImperativeApi>();
    const { icons, initialize, isLoading } = useIconPickerConfig();
    const { data, refetch: refetchCustomIcons } =
        useQuery<ListIconFilesQueryResponse>(LIST_ICON_FILES);
    const customIconsData = data?.fileManager.listFiles.data || [];

    const onFilterChange = useCallback(
        (value, cb) => {
            setFilter(value);
            cb();
        },
        [filter]
    );

    useEffect(() => {
        initialize();
    }, [initialize]);

    const emojis = useMemo(() => {
        return icons.filter(icon => icon.type === "emoji");
    }, [icons]);

    const defaultIcons = useMemo(() => {
        return icons.filter(icon => icon.type === "icon");
    }, [icons]);

    const customIcons = useMemo(() => {
        return customIconsData.map(icon => ({ type: "custom", name: icon.name, value: icon.src }));
    }, [customIconsData]);

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
                        {value?.value ? (
                            <IconRenderer icon={value} />
                        ) : (
                            <SearchIcon width={32} height={32} className={placeholderIcon} />
                        )}
                    </IconPickerInput>
                }
                onOpen={handleSwitchTab}
            >
                {({ closeMenu }: { closeMenu: () => void }) => {
                    const commonTabProps = {
                        value,
                        onChange: (value: Icon, closeAfterChange = true) => {
                            onIconChange(value);
                            if (closeAfterChange) {
                                closeMenu();
                            }
                        },
                        filter,
                        onFilterChange,
                        isLoading
                    };

                    return (
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
                                        {...commonTabProps}
                                    />
                                </Tab>
                                <Tab label={"Emojis"}>
                                    <TabContent icons={emojis} type="emoji" {...commonTabProps} />
                                </Tab>
                                <Tab label={"Custom"}>
                                    <TabContent
                                        icons={customIcons}
                                        type="custom"
                                        refetchCustomIcons={refetchCustomIcons}
                                        {...commonTabProps}
                                    />
                                </Tab>
                            </Tabs>
                        </>
                    );
                }}
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
