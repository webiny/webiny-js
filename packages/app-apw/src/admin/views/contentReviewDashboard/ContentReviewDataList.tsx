import React from "react";
import styled from "@emotion/styled";
import { DataList, List, DataListModalOverlayAction, ListItem } from "@webiny/ui/List";
import { i18n } from "@webiny/app/i18n";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { ApwContentReviewListItem } from "~/types";
import { ContentReviewListItem } from "./components/ContentReviewItem";
import { useDataListModal } from "./hooks/useDataListModal";
import { useContentReviewsList } from "./hooks/useContentReviewsList";
import { ContentReviewsFilterModal } from "./components/ContentReviewsFilterOverlay";

const t = i18n.ns("app-apw/admin/content-reviews/datalist");

const DataListItem = styled(ListItem)`
    &.mdc-list-item {
        padding: 0;
    }
`;

export function ContentReviewDataList() {
    const { status, setStatus, sort, setFilter, setSort, filter } = useDataListModal();
    const { contentReviews, loading, editContentReview } = useContentReviewsList({ sorters: [] });

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
                        <DataListItem key={item.id} onClick={() => editContentReview(item.id)}>
                            <ContentReviewListItem
                                status={item.status}
                                submittedOn={item.createdOn}
                                submittedBy={item.createdBy.displayName}
                                reviewers={item.reviewers}
                                comments={item.totalComments}
                                activeStep={item.activeStep.title}
                                latestCommentId={item.latestCommentId}
                                contentTitle={item.content.title}
                                contentRevisionNumber={item.content.version}
                            />
                        </DataListItem>
                    ))}
                </List>
            )}
        </DataList>
    );
}
