import * as React from "react";
import styled from "@emotion/styled";
import classNames from "classnames";
import Loader from "./Loader";
import NoData from "./NoData";
import { Typography } from "../../Typography";
import { css } from "emotion";
import noop from "lodash/noop";
import isEmpty from "lodash/isEmpty";

import { Checkbox } from "../../Checkbox";
import { Menu, MenuItem } from "../../Menu";
import { Grid, Cell } from "../../Grid";

import {
    RefreshIcon,
    SortIcon,
    FilterIcon,
    PreviousPageIcon,
    NextPageIcon,
    OptionsIcon
} from "./icons";
import { List, ListItem, ListProps } from "..";
import { DataListModalOverlayProvider } from "./DataListModalOverlay";
import { PaginationProp, SortersProp } from "./types";

const ListContainer = styled("div")({
    position: "relative",
    height: "100%",
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
    overflow: "auto",
    height: "calc(100vh - 235px)"
});

const dataListContent = css({
    position: "relative",
    height: "100%",
    overflow: "auto"
});

// This was copied from "./types" so that it can be outputted in docs.
type Props = {
    // Pass a function to take full control of list render.
    children?: Function;

    // A title of paginated list.
    title?: React.ReactNode;

    // FormData that needs to be shown in the list.
    data?: Object[];

    // A callback that must refresh current view by repeating the previous query.
    refresh?: Function;

    // If true, Loader component will be shown, disallowing any interaction.
    loading?: boolean;

    // Provide a custom loader. Shown while the content is loading.
    loader?: React.ReactNode;

    // Provide a custom no data component. Shown while there is no data to be shown.
    noData?: React.ReactNode;

    // Provide all pagination data, options and callbacks here.
    pagination?: PaginationProp;

    // Triggered once a sorter has been selected.
    setSorters?: Function;

    // Provide all sorters options and callbacks here.
    sorters?: SortersProp;

    // Provide actions that will be shown in the top right corner (eg. export or import actions).
    actions?: React.ReactNode;

    // Provide filters that will be shown in the top left corner (eg. filter by category or status).
    filters?: React.ReactNode;

    // Provide actions that can be executed on one or more multi-selected list items (eg. export or delete).
    multiSelectActions?: React.ReactNode;

    // Provide callback that will be executed once user selects all list items.
    multiSelectAll?: (value: boolean) => void;

    // Callback which returns true if all items were selected, otherwise returns false.
    isAllMultiSelected?: () => boolean;

    // Callback which returns true if none of the items were selected, otherwise returns false.
    isNoneMultiSelected?: () => boolean;

    showOptions?: { [key: string]: any };

    // Provide search UI that will be shown in the top left corner.
    search?: React.ReactElement;
    // Provide simple modal UI that will be shown over the list content.
    modalOverlay?: React.ReactElement;
    // Provide an action element that handle toggling the "Modal overlay".
    modalOverlayAction?: React.ReactElement;
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
                                props.setSorters(sorter.value);
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

const Filters = (props: Props) => {
    const filters = props.filters;
    if (!filters) {
        return null;
    }

    return (
        <ListHeaderItem>
            <Menu handle={<FilterIcon />}>{filters}</Menu>
        </ListHeaderItem>
    );
};

const Pagination = (props: Props) => {
    const { pagination } = props;
    if (!pagination) {
        return null;
    }

    return (
        <React.Fragment>
            {pagination.setNextPage && (
                <React.Fragment>
                    <ListHeaderItem
                        className={classNames({
                            disabled: !pagination.hasPreviousPage
                        })}
                    >
                        <PreviousPageIcon
                            onClick={() => {
                                if (pagination.setPreviousPage && pagination.hasPreviousPage) {
                                    pagination.setPreviousPage();
                                }
                            }}
                        />
                    </ListHeaderItem>

                    <ListHeaderItem
                        className={classNames({
                            disabled: !pagination.hasNextPage
                        })}
                    >
                        <NextPageIcon
                            onClick={() => {
                                if (pagination.setNextPage && pagination.hasNextPage) {
                                    pagination.setNextPage();
                                }
                            }}
                        />
                    </ListHeaderItem>
                </React.Fragment>
            )}

            {Array.isArray(pagination.perPageOptions) && pagination.setPerPage && (
                <ListHeaderItem>
                    <Menu handle={<OptionsIcon />}>
                        {pagination.setPerPage &&
                            pagination.perPageOptions.map(perPage => (
                                <MenuItem
                                    key={perPage}
                                    onClick={() =>
                                        pagination.setPerPage && pagination.setPerPage(perPage)
                                    }
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

const Search = (props: Props) => {
    if (!props.search) {
        return null;
    }
    return <Cell span={7}>{React.cloneElement(props.search, props)}</Cell>;
};

export const DataList = (props: Props) => {
    let render = null;

    if (props.loading) {
        render = props.loader;
    } else if (isEmpty(props.data)) {
        render = props.noData;
    } else {
        render = typeof props.children === "function" ? props.children(props) : null;
    }

    return (
        <DataListModalOverlayProvider>
            <ListContainer className={"webiny-data-list"} data-testid={"ui.list.data-list"}>
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
                        <Search {...props} />
                        <Cell span={props.search ? 5 : 12} style={{ justifySelf: "end" }}>
                            <MultiSelectAll {...props} />
                            {props.showOptions.refresh && <RefreshButton {...props} />}
                            {props.showOptions.pagination && <Pagination {...props} />}
                            {props.showOptions.sorters && <Sorters {...props} />}
                            {props.showOptions.filters && <Filters {...props} />}
                            {props.modalOverlayAction ? (
                                <ListHeaderItem>{props.modalOverlayAction}</ListHeaderItem>
                            ) : null}
                            <MultiSelectActions {...props} />
                        </Cell>
                    </Grid>
                )}

                <div className={classNames(dataListContent, "webiny-data-list__content")}>
                    {render}
                    {props.modalOverlay}
                </div>
            </ListContainer>
        </DataListModalOverlayProvider>
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
    filters: null,
    sorters: null,
    setSorters: null,
    actions: null,
    multiSelectAll: noop,
    isAllMultiSelected: () => false,
    isNoneMultiSelected: () => false,
    loader: <Loader />,
    noData: <NoData />,
    showOptions: {
        refresh: true,
        pagination: true,
        sorters: true,
        filters: true
    }
};

export type ScrollListProps = ListProps & {
    children: React.ReactElement<typeof ListItem>[];
};

export const ScrollList = (props: ScrollListProps) => {
    return (
        <List {...props} className={scrollList}>
            {props.children}
        </List>
    );
};
