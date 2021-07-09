import React, { useMemo } from "react";
import debounce from "lodash/debounce";
import { css } from "emotion";
import TimeAgo from "timeago-react";
import pluralize from "pluralize";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Typography } from "@webiny/ui/Typography";
import * as UIList from "@webiny/ui/List";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import statusLabels from "../../constants/statusLabels";
import { useCallback } from "react";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks/useContentEntriesList";

const t = i18n.ns("app-headless-cms/admin/contents/data-list");

const rightAlign = css({
    alignItems: "flex-end !important",
    justifyContent: "center !important"
});

const ModelId = styled("span")({
    color: "var(--mdc-theme-text-secondary-on-background)"
});

const InlineLoaderWrapper = styled("div")({
    position: "absolute",
    bottom: 0,
    left: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 40,
    backgroundColor: "var(--mdc-theme-surface)"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

const ContentEntriesList = () => {
    const {
        contentModel,
        entryId,
        loading,
        canCreate,
        onCreate,
        data,
        editEntry,
        loadMore,
        loadMoreLoading,
        listQueryVariables,
        setListQueryVariables,
        sorters,
        filter,
        setFilter
    } = useContentEntriesList();

    const loadMoreOnScroll = useCallback(
        debounce(scrollFrame => {
            if (scrollFrame.top > 0.9) {
                loadMore();
            }
        }, 500),
        [data]
    );

    const entriesDataListModalOverlay = useMemo(
        () => (
            <UIList.DataListModalOverlay>
                <Form
                    data={listQueryVariables}
                    onChange={({ status, sort }) => {
                        setListQueryVariables(prevState => ({ ...prevState, sort, status }));
                    }}
                >
                    {({ Bind }) => (
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"sort"}>
                                    <Select label={t`Sort by`}>
                                        {sorters.map(({ label, value }) => {
                                            return (
                                                <option key={label} value={value}>
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </Select>
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name={"status"}>
                                    <Select
                                        label={t`Filter by status`}
                                        description={"Filter by a specific page status."}
                                    >
                                        <option value={"all"}>{t`All`}</option>
                                        <option value={"draft"}>{t`Draft`}</option>
                                        <option value={"published"}>{t`Published`}</option>
                                        <option value={"unpublished"}>{t`Unpublished`}</option>
                                        <option
                                            value={"reviewRequested"}
                                        >{t`Review requested`}</option>
                                        <option
                                            value={"changesRequested"}
                                        >{t`Changes requested`}</option>
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                    )}
                </Form>
            </UIList.DataListModalOverlay>
        ),
        [listQueryVariables]
    );

    return (
        <UIList.DataList
            loading={loading}
            data={data}
            title={
                <span>
                    {pluralize(contentModel.name)}
                    <br />
                    <Typography use={"subtitle1"}>
                        <ModelId>Model ID: {contentModel.modelId}</ModelId>
                    </Typography>
                </span>
            }
            actions={
                canCreate ? (
                    <ButtonSecondary data-testid="new-record-button" onClick={onCreate}>
                        <ButtonIcon icon={<AddIcon />} /> {t`New Entry`}
                    </ButtonSecondary>
                ) : null
            }
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search {title}`({ title: pluralize(contentModel.name) })}
                />
            }
            modalOverlay={entriesDataListModalOverlay}
            modalOverlayAction={
                <UIList.DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
        >
            {({ data }) => (
                <>
                    <Scrollbar
                        data-testid="default-data-list"
                        onScrollFrame={scrollFrame => loadMoreOnScroll(scrollFrame)}
                    >
                        {data.map(item => (
                            <UIList.ListItem
                                key={item.id}
                                className={listItemMinHeight}
                                selected={item.id === entryId}
                            >
                                <UIList.ListItemText
                                    onClick={editEntry(item)}
                                >
                                    {item.meta.title || "Untitled"}
                                    <UIList.ListItemTextSecondary>
                                        {t`Last modified: {time}.`({
                                            time: <TimeAgo datetime={item.savedOn} />
                                        })}
                                    </UIList.ListItemTextSecondary>
                                </UIList.ListItemText>

                                <UIList.ListItemMeta className={rightAlign}>
                                    <Typography use={"subtitle2"}>
                                        {statusLabels[item.meta.status]} (v{item.meta.version})
                                    </Typography>
                                </UIList.ListItemMeta>
                            </UIList.ListItem>
                        ))}
                    </Scrollbar>
                    {loadMoreLoading && (
                        <InlineLoaderWrapper>
                            <Typography use={"overline"}>{t`Loading more entries...`}</Typography>
                        </InlineLoaderWrapper>
                    )}
                </>
            )}
        </UIList.DataList>
    );
};

export default ContentEntriesList;
