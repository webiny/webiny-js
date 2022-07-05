import React, { useCallback } from "react";
import debounce from "lodash/debounce";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import styled from "@emotion/styled";
import { DataList, List, DataListModalOverlayAction, ListItem } from "@webiny/ui/List";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { ApwContentReviewListItem } from "~/types";
import { ContentReviewListItem } from "./components/ContentReviewItem";
import { useContentReviewsList } from "~/hooks/useContentReviewsList";
import { ContentReviewsFilterModal } from "./components/ContentReviewsFilterOverlay";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-apw/admin/content-reviews/datalist");

const DataListItem = styled(ListItem)`
    &.mdc-list-item {
        padding: 0;
    }
`;

const SORTERS = [
    {
        label: t`Latest activity`,
        value: "savedOn_DESC"
    },
    {
        label: t`Oldest activity`,
        value: "savedOn_ASC"
    },
    {
        label: t`Title A-Z`,
        value: "savedOn_ASC"
    },
    {
        label: t`Title Z-A`,
        value: "savedOn_DESC"
    }
];

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

export const ContentReviewDataList: React.FC = () => {
    const {
        contentReviews,
        loading,
        editContentReview,
        fetchMoreLoading,
        sort,
        setSort,
        status,
        setStatus,
        setFilter,
        fetchMore,
        filter
    } = useContentReviewsList({
        sorters: SORTERS
    });

    const onScrollFrame = useCallback(
        debounce((scrollFrame: any) => {
            if (scrollFrame.top <= 0.9 || fetchMoreLoading) {
                return;
            }
            fetchMore();
        }, 500),
        [loading, fetchMore]
    );

    return (
        <DataList
            loading={loading}
            data={contentReviews}
            title={t`Content review dashboard`}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search by title`}
                />
            }
            modalOverlay={
                <ContentReviewsFilterModal
                    status={status}
                    setStatus={setStatus}
                    sort={sort}
                    setSort={setSort}
                    sorters={SORTERS}
                />
            }
            modalOverlayAction={
                <DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"content-review-data-list.filter"}
                />
            }
        >
            {({ data }) => {
                return (
                    <>
                        <Scrollbar
                            data-testid="content-review-data-list"
                            onScrollFrame={onScrollFrame}
                        >
                            <List>
                                {data.map((item: ApwContentReviewListItem) => (
                                    <DataListItem
                                        key={item.id}
                                        onClick={() => editContentReview(item)}
                                    >
                                        <ContentReviewListItem {...item} />
                                    </DataListItem>
                                ))}
                            </List>
                        </Scrollbar>
                        {fetchMoreLoading && (
                            <InlineLoaderWrapper>
                                <Typography
                                    use={"overline"}
                                >{t`Loading more entries...`}</Typography>
                            </InlineLoaderWrapper>
                        )}
                    </>
                );
            }}
        </DataList>
    );
};
