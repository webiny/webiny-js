// @flow
import * as React from "react";
import styled from "@emotion/styled";
import classNames from "classnames";
import Loader from "./Loader";
import NoData from "./NoData";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";

import isEmpty from "lodash/isEmpty";

import { Checkbox } from "@webiny/ui/Checkbox";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { Grid, Cell } from "@webiny/ui/Grid";

import { RefreshIcon, SortIcon, PreviousPageIcon, NextPageIcon, OptionsIcon } from "./icons";
import { List, ListItem } from "@webiny/ui/List";

import type { MetaProp, SortersProp } from "./types";

const ListContainer = styled("div")({
    position: "relative",
    ".mdc-list": {
        paddingBottom: 0,
        paddingTop: 0
    },
    ".mdc-list-item": {
        borderBottom: "1px solid var(--mdc-theme-on-background)",
        padding: "10px 20px 10px 20px",
        height: "auto",
        minHeight: 40,
        ".mdc-list-item__text, .mdc-list-item__secondary-text, .webiny-list-text-overline": {
            display: "block"
        },
        ".mdc-list-item__graphic": {
            marginRight: 20
        },
        ".mdc-list-item__text": {
            width: "100%",
            margin: "-20px 0",
            padding: "20px 0"
        },
        ".mdc-list-item__meta": {
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
            position: "relative",
            padding: "5px 0",
            boxSizing: "border-box",
            height: "100%",
            whiteSpace: "nowrap",
            marginTop: -10,
            marginBottom: -10,
            ".webiny-list-actions": {
                display: "none"
            },
            ".webiny-list-top-caption, .webiny-list-bottom-caption": {
                //position: 'absolute',
                width: "100%",
                textAlign: "right"
            },
            ".webiny-list-top-caption": {
                marginBottom: 20
            }
        },
        "&:hover": {
            ".mdc-list-item__meta": {
                ".webiny-list-top-caption, .webiny-list-bottom-caption": {
                    display: "none"
                },
                ".webiny-list-actions": {
                    display: "flex",
                    height: "100%",
                    alignItems: "center"
                }
            }
        }
    }
});

const listHeader = css({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)",
    width: "100%"
});

const listSubHeader = css({
    width: "100%",
    "&.mdc-layout-grid": {
        borderBottom: "1px solid var(--mdc-theme-on-background)",
        padding: "10px 24px 10px 12px",
        color: "var(--mdc-theme-text-primary-on-background)"
    }
});

const ListHeaderItem = styled("div")({
    display: "inline-block",
    verticalAlign: "middle",
    "&.disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

const listTitle = css({
    display: "flex",
    alignItems: "center"
});

const listActions = css({
    textAlign: "right"
});

const scrollList = css({
    overflow: "scroll",
    height: "calc(100vh - 235px)"
});

// This was copied from "./types" so that it can be outputted in docs.
type Props = {
    // Pass a function to take full control of list render.
    children: Function,

    // A title of paginated list.
    title?: React.Node,

    // Data that needs to be shown in the list.
    data?: Array<Object>,

    // A callback that must refresh current view by repeating the previous query.
    refresh?: Function,

    // If true, Loader component will be shown, disallowing any interaction.
    loading?: boolean,

    // Provide a custom loader. Shown while the content is loading.
    loader?: React.Node,

    // Provide a custom no data component. Shown while there is no data to be shown.
    noData?: React.Node,

    // Provide all pagination data, options and callbacks here.
    meta?: MetaProp,

    // Triggered once the page has been selected.
    setPage?: Function,

    // Triggered once a sorter has been selected.
    setSorters?: Function,

    // Triggered once selected filters are submitted.
    setFilters?: Function,

    // Triggered when number of entries per page has been changed.
    setPerPage?: Function,

    // By default, users can choose from 10, 25 or 50 entries per page.
    perPageOptions?: Array<number>,

    // Provide all sorters options and callbacks here.
    sorters: ?SortersProp,

    // Provide actions that will be shown in the top right corner (eg. export or import actions).
    actions?: React.Node,

    // Provide actions that can be executed on one or more multi-selected list items (eg. export or delete).
    multiSelectActions?: React.Node,

    // Provide callback that will be executed once user selects all list items.
    multiSelectAll: (value: boolean) => void,

    // Callback which returns true if all items were selected, otherwise returns false.
    isAllMultiSelected: () => boolean,

    // Callback which returns true if none of the items were selected, otherwise returns false.
    isNoneMultiSelected: () => boolean,

    showOptions: Object
};

const MultiSelectAll = (props: Props) => {
    const { multiSelectActions } = props;
    if (!multiSelectActions) {
        return null;
    }

    return (
        <React.Fragment>
            {typeof props.multiSelectAll === "function" && (
                <ListHeaderItem>
                    <Checkbox
                        indeterminate={!props.isAllMultiSelected() && !props.isNoneMultiSelected()}
                        value={props.isAllMultiSelected()}
                        onClick={() => {
                            props.multiSelectAll(!props.isAllMultiSelected());
                        }}
                    />
                </ListHeaderItem>
            )}
        </React.Fragment>
    );
};

const MultiSelectActions = (props: Props) => {
    const { multiSelectActions } = props;
    if (!multiSelectActions) {
        return null;
    }

    return <ListHeaderItem>{multiSelectActions}</ListHeaderItem>;
};

const RefreshButton = (props: Props) => {
    const refresh = props.refresh;
    if (!refresh) {
        return null;
    }

    return (
        <ListHeaderItem>
            <RefreshIcon onClick={() => refresh()} />
        </ListHeaderItem>
    );
};

const Sorters = (props: Props) => {
    const sorters = props.sorters;
    if (!sorters) {
        return null;
    }

    return (
        <ListHeaderItem>
            <Menu handle={<SortIcon />}>
                {sorters.map(sorter => (
                    <MenuItem
                        key={sorter.label}
                        onClick={() => {
                            if (sorters && props.setSorters) {
                                props.setSorters(sorter.sorters);
                            }
                        }}
                    >
                        {sorter.label}
                    </MenuItem>
                ))}
            </Menu>
        </ListHeaderItem>
    );
};

const Pagination = (props: Props) => {
    const meta = props.meta;
    if (!meta) {
        return null;
    }

    return (
        <React.Fragment>
            {typeof meta.totalCount !== "undefined" && meta.totalCount > 0 && meta.from && meta.to && (
                <ListHeaderItem>
                    {meta.from} - {meta.to} of {meta.totalCount}
                </ListHeaderItem>
            )}

            {props.setPage && (
                <React.Fragment>
                    <ListHeaderItem
                        className={classNames({
                            disabled: !meta.previousPage
                        })}
                    >
                        <PreviousPageIcon
                            onClick={() => {
                                if (props.setPage && meta.previousPage) {
                                    props.setPage(meta.previousPage);
                                }
                            }}
                        />
                    </ListHeaderItem>

                    <ListHeaderItem
                        className={classNames({
                            disabled: !meta.nextPage
                        })}
                    >
                        <NextPageIcon
                            onClick={() => {
                                if (props.setPage && meta.nextPage) {
                                    props.setPage(meta.nextPage);
                                }
                            }}
                        />
                    </ListHeaderItem>
                </React.Fragment>
            )}

            {props.setPerPage && Array.isArray(props.perPageOptions) && (
                <ListHeaderItem>
                    <Menu handle={<OptionsIcon />}>
                        {props.setPerPage &&
                            props.perPageOptions.map(perPage => (
                                <MenuItem
                                    key={perPage}
                                    onClick={() => props.setPerPage && props.setPerPage(perPage)}
                                >
                                    {perPage}
                                </MenuItem>
                            ))}
                    </Menu>
                </ListHeaderItem>
            )}
        </React.Fragment>
    );
};

export const DataList = (props: Props) => {
    let render = null;
    if (props.loading) {
        render = props.loader;
    } else {
        if (isEmpty(props.data)) {
            render = props.noData;
        } else {
            if (typeof props.children === "function") {
                render = props.children(props);
            }
        }
    }

    return (
        <ListContainer className={"webiny-data-list"}>
            {(props.title || props.actions) && (
                <Grid className={listHeader}>
                    <Cell span={6} className={listTitle}>
                        <Typography use="headline5">{props.title}</Typography>
                    </Cell>
                    <Cell span={6} className={listActions}>
                        {props.actions}
                    </Cell>
                </Grid>
            )}

            {Object.keys(props.showOptions).length > 0 && (
                <Grid className={listSubHeader}>
                    <Cell span={props.showOptions.pagination ? 5 : 12}>
                        <MultiSelectAll {...props} />
                        {props.showOptions.refresh && <RefreshButton {...props} />}
                        {props.showOptions.sorters && <Sorters {...props} />}
                        <MultiSelectActions {...props} />
                    </Cell>

                    {props.showOptions.pagination && (
                        <Cell span={7} style={{ textAlign: "right" }}>
                            <Pagination {...props} />
                        </Cell>
                    )}
                </Grid>
            )}

            {render}
        </ListContainer>
    );
};

DataList.defaultProps = {
    children: null,
    title: null,
    data: null,
    meta: null,
    loading: false,
    refresh: null,
    setPage: null,
    setPerPage: null,
    perPageOptions: [10, 25, 50],
    sorters: null,
    setSorters: null,
    actions: null,
    multiSelectAll: () => {},
    isAllMultiSelected: () => false,
    isNoneMultiSelected: () => false,
    loader: <Loader />,
    noData: <NoData />,
    showOptions: {
        refresh: true,
        pagination: true,
        sorters: true
    }
};

export const ScrollList = (props: {
    children: React.ChildrenArray<React.Element<typeof ListItem>>
}) => {
    return (
        <List {...props} className={scrollList}>
            {props.children}
        </List>
    );
};
