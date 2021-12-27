import React, { useMemo } from "react";
import { DataList, List, DataListModalOverlayAction, DataListModalOverlay } from "@webiny/ui/List";
import { i18n } from "@webiny/app/i18n";
import SearchUI from "@webiny/app-admin/components/SearchUI";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { ApwContentReviewStatus } from "~/types";
import ContentReviewListItem from "./components/ContentReviewItem";
import { useDataListModal } from "~/admin/views/contentReviewDashboard/hooks/useDataListModal";

const t = i18n.ns("app-apw/admin/content-reviews/datalist");

const MOCK_ITEM = {
    id: 1,
    contentTitle: t`Home page`,
    contentRevisionNumber: 12,
    activeStep: "Designer Approval",
    submittedOn: "Nov 15th, 2021",
    submittedBy: "Jack Dorsey",
    status: ApwContentReviewStatus.READY_TO_BE_PUBLISHED,
    reviewers: [{}, {}, {}],
    comments: 15,
    comment: `The upper error message is correct, but the lower one should say “Not authorised” instead.`,
    commentedBy: t`Sven`,
    commentedOn: "Nov 17th, 2021"
};
const MOCK_ITEM2 = {
    id: 2,
    contentTitle: t`About page`,
    contentRevisionNumber: 6,
    activeStep: "Editor Approval",
    submittedOn: "Dec 15th, 2021",
    submittedBy: "Jack Dorsey",
    status: ApwContentReviewStatus.UNDER_REVIEW,
    reviewers: [{}, {}],
    comments: 225,
    comment: `The help text is confusing, let's rewrite it as something like this.`,
    commentedBy: t`Adrian`,
    commentedOn: "Dec 27th, 2021"
};

const MOCK_ITEM3 = {
    id: 3,
    contentTitle: t`Pricing page`,
    contentRevisionNumber: 6,
    activeStep: "Marketing Approval",
    submittedOn: "Nov 25th, 2021",
    submittedBy: "Jack Dorsey",
    status: ApwContentReviewStatus.PUBLISHED,
    reviewers: [{}],
    comments: 8,
    comment: `Just double the price 💸. Everything else looks fine. To be honest, I've not even read it. Just chattering.`,
    commentedBy: t`Big Show`,
    commentedOn: "Nov 27th, 2021"
};

function ContentReviewDataList() {
    const { status, setStatus, sort, setFilter, setSort, filter } = useDataListModal();

    const SORTERS = [];
    const serializeSorters = sorter => {
        return sorter;
    };

    const contentModelsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select
                            value={status}
                            onChange={setStatus}
                            label={t`Filter by`}
                            description={t`Filter by a specific status.`}
                        >
                            <option value={"all"}>{t`All`}</option>
                            <option
                                value={ApwContentReviewStatus.UNDER_REVIEW}
                            >{t`Under review`}</option>
                            <option
                                value={ApwContentReviewStatus.READY_TO_BE_PUBLISHED}
                            >{t`Ready to be published`}</option>
                            <option value={ApwContentReviewStatus.PUBLISHED}>{t`Published`}</option>
                        </Select>
                    </Cell>
                    <Cell span={12}>
                        <Select
                            value={sort}
                            onChange={setSort}
                            label={t`Sort by`}
                            description={t`Sort reviews by.`}
                        >
                            {SORTERS.map(({ label, sorters }) => {
                                return (
                                    <option key={label} value={serializeSorters(sorters)}>
                                        {label}
                                    </option>
                                );
                            })}
                        </Select>
                    </Cell>
                </Grid>
            </DataListModalOverlay>
        ),
        [sort]
    );

    return (
        <DataList
            data={[MOCK_ITEM, MOCK_ITEM2, MOCK_ITEM3]}
            title={t`Content review dashboard`}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={t`Search by title`}
                />
            }
            modalOverlay={contentModelsDataListModalOverlay}
            modalOverlayAction={
                <DataListModalOverlayAction
                    icon={<FilterIcon />}
                    data-testid={"default-data-list.filter"}
                />
            }
        >
            {({ data }) => (
                <List>
                    {data.map((item, index) => (
                        <ContentReviewListItem key={index} {...item} />
                    ))}
                </List>
            )}
        </DataList>
    );
}

export default ContentReviewDataList;
