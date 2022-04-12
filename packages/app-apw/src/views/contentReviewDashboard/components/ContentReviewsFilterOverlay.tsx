import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { DataListModalOverlay } from "@webiny/ui/List";
import { ApwContentReviewStatus } from "~/types";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-apw/admin/content-reviews/datalist/modal");

const REQUIRES_MY_ATTENTION = "requiresMyAttention";

interface ContentReviewsFilterModalProps {
    status: string;
    setStatus: (value: any) => void;
    sort: string | null;
    setSort: (value: any) => void;
    sorters: { label: string; value: string }[];
}

export const ContentReviewsFilterModal = (props: ContentReviewsFilterModalProps) => {
    const { status, setStatus, sort, setSort, sorters } = props;

    return (
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
                        <option value={REQUIRES_MY_ATTENTION}>{t`Requires my attention`}</option>
                    </Select>
                </Cell>
                <Cell span={12}>
                    <Select
                        value={sort || ""}
                        onChange={setSort}
                        label={t`Sort by`}
                        description={t`Sort reviews by.`}
                    >
                        {sorters.map(({ label, value }) => {
                            return (
                                <option key={label} value={value}>
                                    {label}
                                </option>
                            );
                        })}
                    </Select>
                </Cell>
            </Grid>
        </DataListModalOverlay>
    );
};
