import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { css } from "emotion";
import { css as reactCss, Global } from "@emotion/react";
import { plugins } from "@webiny/plugins";
import { Typography } from "@webiny/ui/Typography";
import { Grid } from "react-virtualized";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DelayedOnChange, OnChangeCallable } from "@webiny/ui/DelayedOnChange";
import { Menu, RenderableMenuChildren } from "@webiny/ui/Menu";
import { Input } from "@webiny/ui/Input";
import { CmsIcon, CmsIconsPlugin } from "~/types";
import { FormComponentProps } from "@webiny/ui/types";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { GridCellProps } from "react-virtualized/dist/es/Grid";

/**
 * Controls the helper text below the checkbox.
 * @type {string}
 */
const iconPickerLabel = css({ marginBottom: 5, marginLeft: 2 });

const globalStyles = reactCss`
    #rmwcPortal > .mdc-menu-surface {
        z-index: 1000;
    }
`;

const MenuWrapper = css`
    color: var(--mdc-theme-text-secondary-on-background);
    background-color: var(--mdc-theme-on-background);
    border-bottom: 1px solid var(--mdc-theme-text-secondary-on-background, rgba(0, 0, 0, 0.54));
    padding: 16px 8px;
    cursor: pointer;
    :hover {
        border-bottom: 1px solid rgba(0, 0, 0, 1);
    }
`;

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

export interface IconPickerProps extends FormComponentProps {
    label?: React.ReactNode;
    description?: React.ReactNode;
}

interface RenderCellParams {
    closeMenu: () => void;
}

export const IconPicker = ({
    value,
    onChange,
    label,
    description,
    validation
}: IconPickerProps) => {
    const [filter, setFilter] = useState("");
    const [mustRenderGrid, setMustRenderGrid] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => {
            if (mustRenderGrid && inputRef.current) {
                inputRef.current.focus();
            }
        }, 50);
    }, [mustRenderGrid]);

    const onFilterChange = useCallback<OnChangeCallable>(
        (value, cb) => {
            setFilter(value);
            if (cb) {
                cb(value);
            }
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
        ({ closeMenu }: RenderCellParams) => {
            return function renderCell({
                columnIndex,
                key,
                rowIndex,
                style
            }: GridCellProps): React.ReactNode {
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
                            if (onChange) {
                                onChange(item.id.join("/"));
                            }
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

    const renderGrid = useCallback<RenderableMenuChildren>(
        ({ closeMenu }) => {
            return (
                <>
                    <Global styles={globalStyles} />
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

    const { isValid: validationIsValid, message: validationMessage } = validation || {};

    return (
        <>
            {label && (
                <div className={iconPickerLabel}>
                    <Typography use={"body1"}>{label}</Typography>
                </div>
            )}

            <Menu
                onOpen={() => setMustRenderGrid(true)}
                onClose={() => setMustRenderGrid(false)}
                renderToPortal={true}
                render={mustRenderGrid ? renderGrid : () => null}
                handle={
                    <div className={MenuWrapper}>
                        <div className={pickIcon}>
                            <FontAwesomeIcon icon={fontAwesomeIconValue} size={"2x"} />
                        </div>
                    </div>
                }
            />

            {validationIsValid === false && (
                <FormElementMessage error>{validationMessage}</FormElementMessage>
            )}
            {validationIsValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </>
    );
};
