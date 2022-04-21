import React from "react";
import styled from "@emotion/styled";
import { DataList, List, DataListModalOverlayAction, ListItem } from "@webiny/ui/List";
import { i18n } from "@webiny/app/i18n";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { ApwContentReviewListItem } from "~/types";
import { ContentReviewListItem } from "./components/ContentReviewItem";
import { useContentReviewsList } from "~/hooks/useContentReviewsList";
import { ContentReviewsFilterModal } from "./components/ContentReviewsFilterOverlay";

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

export function ContentReviewDataList() {
    const {
        contentReviews,
        loading,
        editContentReview,
        sort,
        setSort,
        status,
        setStatus,
        setFilter,
        filter
    } = useContentReviewsList({
        sorters: SORTERS
    });

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
                    data-testid={"default-data-list.filter"}
                />
            }
        >
            {({ data }) => (
                <List>
                    {data.map((item: ApwContentReviewListItem) => (
                        <DataListItem key={item.id} onClick={() => editContentReview(item)}>
                            <ContentReviewListItem {...item} />
                        </DataListItem>
                    ))}
                </List>
            )}
        </DataList>
    );
}
