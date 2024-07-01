import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { css } from "emotion";
import { plugins } from "@webiny/plugins";
import { Typography } from "@webiny/ui/Typography";
import { Grid } from "react-virtualized";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { Menu, MenuChildrenFunctionProps } from "@webiny/ui/Menu";
import { Input } from "@webiny/ui/Input";
import { PbIcon, PbIconsPlugin } from "~/types";
import classNames from "classnames";
import { COLORS } from "../plugins/elementSettings/components/StyledComponents";
// Icons
import { ReactComponent as IconPickerIcon } from "../assets/icons/icon-picker.svg";

interface RenderCellCallableParams {
    columnIndex: number;
    rowIndex: number;
    key: string;
    style: CSSProperties;
}
interface RenderCellCallable {
    (params: RenderCellCallableParams): React.ReactElement | null;
}

const noop = (): React.ReactElement | null => null;
const gridItem = css({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    boxSizing: "border-box",
    paddingTop: 15,
    alignItems: "center",
    textAlign: "center",
    cursor: "pointer",
    transform: "translateZ(0)",
    borderRadius: 2,
    color: "var(--mdc-theme-text-secondary-on-background)",
    transition: "all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)",
    "&::after": {
        boxShadow: "0 0.25rem 0.125rem 0 rgba(0,0,0,0.05)",
        transition: "opacity 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)",
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        opacity: 0
    },
    "&:hover": {
        backgroundColor: "var(--mdc-theme-background)",
        color: "var(--mdc-theme-text-primary-on-background)",
        "&::after": {
            opacity: 1
        }
    },
    ">svg": {
        width: 42,
        marginBottom: 5
    }
});

const gridItemSelected = css({
    backgroundColor: "var(--mdc-theme-text-secondary-on-background)",
    color: "#FFFFFF",
    ">svg": {
        fill: "#FFFFFF"
    },
    "> .remove": {
        position: "absolute",
        width: "auto",
        marginBottom: "0",
        top: "2px",
        right: "5px"
    }
});

const grid = css({
    padding: 20
});

const pickIcon = css({
    width: 50,
    textAlign: "center",
    cursor: "pointer"
});

const searchInput = css({
    input: {
        padding: "20px 12px 20px",
        "&::placeholder": {
            opacity: "1 !important"
        }
    }
});

const iconPickerWrapper = css({
    display: "flex",
    justifyContent: "flex-end",
    height: 30,

    "& .mdc-menu-surface--anchor": {
        position: "static"
    },

    "& .button": {
        boxSizing: "border-box",
        width: 30,
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.lightGray,
        borderRadius: 1,
        border: `1px solid ${COLORS.gray}`,
        cursor: "pointer",
        "&:hover:not(:disabled)": { borderColor: COLORS.darkGray, backgroundColor: COLORS.gray },
        "&:focus:not(:disabled)": {
            borderColor: COLORS.darkGray,
            outline: "none",
            backgroundColor: COLORS.gray
        },
        "&:disabled": {
            opacity: 0.5,
            cursor: "not-allowed",
            borderColor: COLORS.lightGray
        }
    },
    "& .iconContainer": {
        boxSizing: "border-box",
        width: 30,
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.lightGray,
        borderRadius: 1,
        border: `1px solid ${COLORS.gray}`,

        "& svg": {
            width: 16,
            height: 16
        },
        "&.disabled": {
            pointerEvents: "none",
            opacity: 0.5
        }
    }
});

interface IconPickerPropsType {
    value?: IconProp;
    onChange: (item: PbIcon) => void;
    removable?: boolean;
    handlerClassName?: string;
    useInSidebar?: boolean;
    removeIcon?: () => void;
}
const IconPicker = ({
    value,
    onChange,
    removable = true,
    handlerClassName,
    useInSidebar,
    removeIcon = noop
}: IconPickerPropsType) => {
    const [filter, setFilter] = useState<string>("");
    const [mustRenderGrid, setMustRenderGrid] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => {
            if (mustRenderGrid && inputRef.current) {
                inputRef.current.focus();
            }
        }, 50);
    }, [mustRenderGrid]);

    // Icon "Grid" props
    const columnCount = useInSidebar ? 3 : 6;
    const columnWidth = useInSidebar ? 85 : 100;
    const gridWidth = useInSidebar ? 300 : 640;

    const onFilterChange = useCallback(
        (value: string) => {
            setFilter(value.trim());
        },
        [filter]
    );

    const { prefix: selectedIconPrefix, name: selectedIconName } = useMemo(() => {
        if (!value || !Array.isArray(value) || !removable) {
            return {
                prefix: undefined,
                name: undefined
            };
        }
        return {
            prefix: value[0],
            name: value[1]
        };
    }, [value]);

    const allIcons: PbIcon[] = useMemo(() => {
        const iconPlugins = plugins.byType<PbIconsPlugin>("pb-icons");
        let selectedIconItem = null;
        const allIconItems = iconPlugins.reduce((icons: Array<PbIcon>, pl) => {
            const pluginIcons = pl.getIcons().filter(({ id }) => {
                const [prefix, name] = id;
                if (!selectedIconPrefix || !selectedIconName || prefix !== selectedIconPrefix) {
                    return true;
                }
                return name !== selectedIconName;
            });
            const selectedIcon = pl.getIcons().find(({ name }) => {
                return name === selectedIconName;
            });
            if (selectedIcon) {
                selectedIconItem = selectedIcon;
            }
            return icons.concat(pluginIcons);
        }, []);
        if (selectedIconItem) {
            allIconItems.unshift(selectedIconItem);
        }
        return allIconItems;
    }, [selectedIconPrefix, selectedIconName]);

    const icons = useMemo(() => {
        return filter ? allIcons.filter(ic => ic.name.includes(filter)) : allIcons;
    }, [filter, selectedIconPrefix, selectedIconName]);

    const renderCell = useCallback(
        ({ closeMenu }: MenuChildrenFunctionProps): RenderCellCallable => {
            return function renderCell({ columnIndex, key, rowIndex, style }) {
                const item = icons[rowIndex * columnCount + columnIndex];
                if (!item) {
                    return null;
                }
                const isSelectedIcon =
                    item.id[0] === selectedIconPrefix && item.id[1] === selectedIconName;
                const gridItemClassName = classNames(gridItem, {
                    [gridItemSelected]: isSelectedIcon
                });
                return (
                    <div
                        key={key}
                        style={style}
                        className={gridItemClassName}
                        onClick={() => {
                            onChange(item);
                            closeMenu();
                        }}
                    >
                        {isSelectedIcon && (
                            <span className="remove">
                                <FontAwesomeIcon icon={["fas", "times"]} />
                            </span>
                        )}
                        <FontAwesomeIcon icon={item.id} size={"2x"} />
                        <Typography use={"body2"}>{item.name}</Typography>
                    </div>
                );
            };
        },
        [icons]
    );

    const renderGrid = useCallback(
        ({ closeMenu }: MenuChildrenFunctionProps) => {
            if (useInSidebar && !mustRenderGrid) {
                return;
            }

            return (
                <>
                    <DelayedOnChange value={filter} onChange={onFilterChange}>
                        {({ value, onChange }) => (
                            <Input
                                inputRef={inputRef}
                                className={searchInput}
                                value={value}
                                onChange={onChange}
                                placeholder={"Search icons..."}
                            />
                        )}
                    </DelayedOnChange>
                    <Grid
                        className={grid}
                        cellRenderer={renderCell({ closeMenu })}
                        columnCount={columnCount}
                        columnWidth={columnWidth}
                        height={440}
                        rowCount={Math.ceil(icons.length / columnCount)}
                        rowHeight={100}
                        width={gridWidth}
                    />
                </>
            );
        },
        [useInSidebar, mustRenderGrid, icons]
    );

    if (useInSidebar) {
        const disableRemoveIcon = !value || !removable;
        return (
            <div className={iconPickerWrapper}>
                <Menu
                    onOpen={() => setMustRenderGrid(true)}
                    onClose={() => setMustRenderGrid(false)}
                    handle={
                        <div className={classNames("button", "menuHandler", handlerClassName)}>
                            <IconPickerIcon />
                        </div>
                    }
                    render={renderGrid}
                />
                <div
                    className={classNames("button", "iconContainer", {
                        disabled: disableRemoveIcon
                    })}
                    onClick={removeIcon}
                >
                    <FontAwesomeIcon icon={value || ["far", "star"]} size={"2x"} />
                </div>
            </div>
        );
    }

    return (
        <Menu
            handle={
                <div className={classNames(pickIcon, handlerClassName)}>
                    <FontAwesomeIcon icon={value || ["far", "star"]} size={"2x"} />
                </div>
            }
            render={renderGrid}
        />
    );
};

export default IconPicker;
