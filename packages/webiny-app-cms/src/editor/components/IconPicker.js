// @flow
import * as React from "react";
import { css } from "emotion";
import { compose, withState, withHandlers, withProps } from "recompose";
import { getPlugins } from "webiny-plugins";
import { Typography } from "webiny-ui/Typography";
import { Grid } from "react-virtualized";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { Menu } from "webiny-ui/Menu";
import { Input } from "webiny-ui/Input";

let icons = null;

const COLUMN_COUNT = 6;

const gridItem = css({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    cursor: "pointer"
});

const grid = css({
    padding: 20
});

const IconPicker = ({ value, renderGrid }: Object) => {
    return (
        <Menu
            handle={
                <div style={{ width: 50, textAlign: "center" }}>
                    <FontAwesomeIcon icon={value || ["fab", "font-awesome-flag"]} size={"2x"} />
                </div>
            }
        >
            {renderGrid}
        </Menu>
    );
};

export default compose(
    withState("filter", "setFilter", ""),
    withProps(({ filter }) => {
        if (!icons) {
            icons = getPlugins("cms-icons").reduce((icons: Array<Object>, pl: Object) => {
                return icons.concat(pl.getIcons());
            }, []);
        }

        return {
            icons: icons ? (filter ? icons.filter(ic => ic.name.includes(filter)) : icons) : []
        };
    }),
    withHandlers({
        renderCell: ({ onChange, icons }) => ({ closeMenu }) => {
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
        }
    }),
    withHandlers({
        renderGrid: ({ filter, setFilter, renderCell, icons }) =>
            function renderGrid({ closeMenu }) {
                return (
                    <React.Fragment>
                        <DelayedOnChange value={filter} onChange={setFilter}>
                            {({ value, onChange }) => (
                                <Input
                                    autoFocus
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
                    </React.Fragment>
                );
            }
    })
)(IconPicker);
