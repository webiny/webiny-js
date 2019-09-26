// @flow
import * as React from "react";
import { css } from "emotion";
import { getPlugins } from "@webiny/plugins";
import { Typography } from "@webiny/ui/Typography";
import { Grid } from "react-virtualized";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DelayedOnChange } from "@webiny/app-page-builder/editor/components/DelayedOnChange";
import { Menu } from "@webiny/ui/Menu";
import { Input } from "@webiny/ui/Input";

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
        zIndex: "-1",
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

const { useState, useCallback, useMemo, Fragment } = React;

const IconPicker = ({ value, onChange }: Object) => {
    const [filter, setFilter] = useState("");

    const onFilterChange = useCallback(
        (value, cb) => {
            setFilter(value);
            cb();
        },
        [filter]
    );

    const allIcons = useMemo(() => {
        return getPlugins("pb-icons").reduce((icons: Array<Object>, pl: Object) => {
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
                            onChange(item);
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

    const renderGrid = useCallback(({ closeMenu }) => {
        return (
            <Fragment>
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
            </Fragment>
        );
    });

    return (
        <Menu
            handle={
                <div className={pickIcon}>
                    <FontAwesomeIcon icon={value || ["far", "star"]} size={"2x"} />
                </div>
            }
        >
            {renderGrid}
        </Menu>
    );
};

export default IconPicker;
