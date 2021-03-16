import * as React from "react";
import { css } from "emotion";
import { plugins } from "@webiny/plugins";
import { Typography } from "@webiny/ui/Typography";
import { Grid } from "react-virtualized";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DelayedOnChange from "./DelayedOnChange";
import { Menu } from "@webiny/ui/Menu";
import { Input } from "@webiny/ui/Input";
import { CmsIcon, CmsIconsPlugin } from "~/types";
import { FormComponentProps } from "@webiny/ui/types";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

/**
 * Controls the helper text below the checkbox.
 * @type {string}
 */
const iconPickerLabel = css({ marginBottom: 5, marginLeft: 2 });

const MenuWrapper = css({
    color: "var(--mdc-theme-text-secondary-on-background)",
    backgroundColor: "var(--mdc-theme-on-background)",
    padding: "16px 8px"
});

const NoResultWrapper = css({
    width: 640,
    color: "var(--mdc-theme-text-secondary-on-background)",
    padding: "16px 12px"
});

const COLUMN_COUNT = 6;

const gridItem = css({
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
        padding: "20px 12px 20px"
    }
});

const { useState, useCallback, useMemo } = React;

const IconPicker = ({
    value,
    onChange,
    label,
    description,
    validation
}: FormComponentProps & {
    label?: React.ReactNode;
    description?: React.ReactNode;
}) => {
    const [filter, setFilter] = useState("");
    const [mustRenderGrid, setMustRenderGrid] = useState(false);

    const onFilterChange = useCallback(
        (value, cb) => {
            setFilter(value);
            cb();
        },
        [filter]
    );

    const allIcons: CmsIcon[] = useMemo(() => {
        const iconPlugins = plugins.byType<CmsIconsPlugin>("cms-icons");
        return iconPlugins.reduce((icons: Array<CmsIcon>, pl) => {
            return icons.concat(pl.getIcons());
        }, []);
    }, []);

    const icons = useMemo(() => {
        return filter ? allIcons.filter(ic => ic.name.includes(filter)) : allIcons;
    }, [filter]);

    const renderCell = useCallback(
        ({ closeMenu }) => {
            return function renderCell({ columnIndex, key, rowIndex, style }) {
                const item = icons[rowIndex * COLUMN_COUNT + columnIndex];
                if (!item) {
                    return null;
                }

                return (
                    <div
                        key={key}
                        style={style}
                        className={gridItem}
                        onClick={() => {
                            onChange(item.id.join("/"));
                            closeMenu();
                        }}
                    >
                        <FontAwesomeIcon icon={item.id} size={"2x"} />
                        <Typography use={"body2"}>{item.name}</Typography>
                    </div>
                );
            };
        },
        [icons]
    );

    const renderGrid = useCallback(
        ({ closeMenu }) => {
            return (
                <>
                    <DelayedOnChange value={filter} onChange={onFilterChange}>
                        {({ value, onChange }) => (
                            <Input
                                autoFocus
                                className={searchInput}
                                value={value}
                                onChange={onChange}
                                placeholder={"Search icons..."}
                            />
                        )}
                    </DelayedOnChange>
                    {icons.length === 0 ? (
                        <div className={NoResultWrapper}>
                            <Typography use="body1">No results found.</Typography>
                        </div>
                    ) : (
                        <Grid
                            className={grid}
                            cellRenderer={renderCell({ closeMenu })}
                            columnCount={COLUMN_COUNT}
                            columnWidth={100}
                            height={440}
                            rowCount={Math.ceil(icons.length / COLUMN_COUNT)}
                            rowHeight={100}
                            width={640}
                        />
                    )}
                </>
            );
        },
        [icons]
    );

    const fontAwesomeIconValue: any =
        typeof value === "string" && value.includes("/") ? value.split("/") : ["fas", "star"];

    return (
        <>
            {label && (
                <div className={iconPickerLabel}>
                    <Typography use={"body1"}>{label}</Typography>
                </div>
            )}
            <div className={MenuWrapper}>
                <Menu
                    onOpen={() => setMustRenderGrid(true)}
                    onClose={() => setMustRenderGrid(false)}
                    handle={
                        <div className={pickIcon}>
                            <FontAwesomeIcon icon={fontAwesomeIconValue} size={"2x"} />
                        </div>
                    }
                >
                    {mustRenderGrid && renderGrid}
                </Menu>
            </div>
            {validation.isValid === false && (
                <FormElementMessage error>{validation.message}</FormElementMessage>
            )}
            {validation.isValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </>
    );
};

export default IconPicker;
