import React from "react";
import styled from "@emotion/styled";
import classNames from "classnames";
import Loader from "./Loader";
import NoData from "./NoData";
import { Typography } from "~/Typography";
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

interface DataListData {
    [key: string]: Record<string, any>[];
}

// This was copied from "./types" so that it can be outputted in docs.
interface DataListWithSectionsProps {
    // Pass a function to take full control of list render.
    children?: ((props: any) => React.ReactNode) | null;

    // A title of paginated list.
    title?: React.ReactNode;

    // FormData that needs to be shown in the list.
    data?: DataListData | null;

    // A callback that must refresh current view by repeating the previous query.
    refresh?: (() => void) | null;

    // If true, Loader component will be shown, disallowing any interaction.
    loading?: boolean;

    // Provide a custom loader. Shown while the content is loading.
    loader?: React.ReactNode;

    // Provide a custom no data component. Shown while there is no data to be shown.
    noData?: React.ReactNode;

    // Provide all pagination data, options and callbacks here.
    pagination?: PaginationProp;

    // Triggered once a sorter has been selected.
    setSorters?: Function | null;

    // Provide all sorters options and callbacks here.
    sorters?: SortersProp | null;

    // Provide actions that will be shown in the top right corner (eg. export or import actions).
    actions?: React.ReactNode;

    // Provide filters that will be shown in the top left corner (eg. filter by category or status).
    filters?: React.ReactNode;

    // Provide actions that can be executed on one or more multi-selected list items (eg. export or delete).
    multiSelectActions?: React.ReactNode;

    // Provide callback that will be executed once user selects all list items.
    multiSelectAll?: (value: boolean, data: DataListData | null) => void;

    // Callback which returns true if all items were selected, otherwise returns false.
    isAllMultiSelected?: (data: DataListData | null) => boolean;

    // Callback which returns true if none of the items were selected, otherwise returns false.
    isNoneMultiSelected?: (data: DataListData | null) => boolean;

    showOptions?: {
        refresh?: boolean;
        pagination?: boolean;
        filters?: boolean;
        sorters?: boolean;
        [key: string]: any;
    };

    // Provide search UI that will be shown in the top left corner.
    search?: React.ReactElement;
    // Provide simple modal UI that will be shown over the list content.
    modalOverlay?: React.ReactElement;
    // Provide an action element that handle toggling the "Modal overlay".
    modalOverlayAction?: React.ReactElement;
    // Provide additional UI for list sub-header.
    subHeader?: React.ReactElement;

    meta?: Record<string, any> | null;

    setPage?: ((page: string) => void) | null;

    setPerPage?: ((page: string) => void) | null;

    perPageOptions?: number[];
}

const MultiSelectAll: React.FC<DataListWithSectionsProps> = props => {
    const { multiSelectActions } = props;
    if (!multiSelectActions) {
        return null;
    }
    /**
     * We can safely cast because we have defaults.
     */
    const { isAllMultiSelected, isNoneMultiSelected, multiSelectAll, data } =
        props as Required<DataListWithSectionsProps>;

    return (
        <React.Fragment>
            {typeof multiSelectAll === "function" && (
                <ListHeaderItem>
                    <Checkbox
                        indeterminate={!isAllMultiSelected(data) && !isNoneMultiSelected(data)}
                        value={isAllMultiSelected(data)}
                        onClick={() => {
                            multiSelectAll(!isAllMultiSelected(data), data);
                        }}
                    />
                </ListHeaderItem>
            )}
        </React.Fragment>
    );
};

const MultiSelectActions: React.FC<DataListWithSectionsProps> = props => {
    const { multiSelectActions } = props;
    if (!multiSelectActions) {
        return null;
    }

    return <ListHeaderItem>{multiSelectActions}</ListHeaderItem>;
};

const RefreshButton: React.FC<DataListWithSectionsProps> = props => {
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

const Sorters: React.FC<DataListWithSectionsProps> = props => {
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

const Filters: React.FC<DataListWithSectionsProps> = props => {
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

const Pagination: React.FC<DataListWithSectionsProps> = props => {
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

const Search: React.FC<DataListWithSectionsProps> = props => {
    if (!props.search) {
        return null;
    }
    return <Cell span={7}>{React.cloneElement(props.search, props)}</Cell>;
};

export const DataListWithSections: React.FC<DataListWithSectionsProps> = props => {
    let render: React.ReactNode = null;

    if (props.loading) {
        render = props.loader;
    } else if (isEmpty(props.data)) {
        render = props.noData;
    } else {
        const ch = props.children;
        render = typeof ch === "function" ? ch(props) : null;
    }

    const showOptions = props.showOptions || {};

    const listHeaderActionsCellSpan = props.actions ? 7 : 0;
    const listHeaderTitleCellSpan = 12 - listHeaderActionsCellSpan;

    return (
        <DataListModalOverlayProvider>
            <ListContainer className={"webiny-data-list"} data-testid={"ui.list.data-list"}>
                {(props.title || props.actions) && (
                    <Grid className={listHeader}>
                        <Cell span={listHeaderTitleCellSpan} className={listTitle}>
                            <Typography use="headline5">{props.title}</Typography>
                        </Cell>
                        {props.actions && (
                            <Cell span={listHeaderActionsCellSpan} className={listActions}>
                                {props.actions}
                            </Cell>
                        )}
                    </Grid>
                )}

                {Object.keys(showOptions).length > 0 && (
                    <Grid className={listSubHeader}>
                        <Search {...props} />
                        <Cell span={props.search ? 5 : 12} style={{ justifySelf: "end" }}>
                            <MultiSelectAll {...props} />
                            {showOptions.refresh && <RefreshButton {...props} />}
                            {showOptions.pagination && <Pagination {...props} />}
                            {showOptions.sorters && <Sorters {...props} />}
                            {showOptions.filters && <Filters {...props} />}
                            {props.modalOverlayAction ? (
                                <ListHeaderItem>{props.modalOverlayAction}</ListHeaderItem>
                            ) : null}
                            <MultiSelectActions {...props} />
                        </Cell>
                    </Grid>
                )}

                <div className={classNames(dataListContent, "webiny-data-list__content")}>
                    {props.subHeader}
                    {render}
                    {props.modalOverlay}
                </div>
            </ListContainer>
        </DataListModalOverlayProvider>
    );
};

DataListWithSections.defaultProps = {
    children: null,
    title: null,
    data: null,
    meta: null,
    loading: false,
    refresh: () => {
        return void 0;
    },
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

interface ScrollListWithSectionsProps extends ListProps {
    children: React.ReactElement<typeof ListItem>[];
}

export const ScrollListWithSections: React.FC<ScrollListWithSectionsProps> = props => {
    return (
        <List {...props} className={classNames(props.className, scrollList)}>
            {props.children}
        </List>
    );
};
