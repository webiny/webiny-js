import React from "react";
import styled from "@emotion/styled";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { Chip } from "@webiny/ui/Chips";
import { CompanyStatus } from "@demo/shared";
import { Company } from "../types";

const { Browser } = ContentEntryListConfig;
const { useTableRow, isFolderRow } = Browser.Table.Column;

const DraftChip = styled(Chip)`
    background-color: gray;
    color: white;
`;

const ClosedChip = styled(Chip)`
    background-color: #daaeae;
`;

const LiveChip = styled(Chip)`
    background-color: #088527;
    color: white;
`;

const OnboardedChip = styled(Chip)`
    background-color: #23dafa;
`;

const TrainingChip = styled(Chip)`
    background-color: #eeee00;
`;

const ReviewChip = styled(Chip)`
    background-color: #d21d1d;
    color: white;
`;

const statusChips: Record<CompanyStatus, JSX.Element> = {
    [CompanyStatus.DRAFT]: <DraftChip label={"Draft"} />,
    [CompanyStatus.CUSTOMER_CLOSED]: <ClosedChip label={"Closed"} />,
    [CompanyStatus.CUSTOMER_LIVE]: <LiveChip label={"Live!"} />,
    [CompanyStatus.CUSTOMER_ONBOARDED]: <OnboardedChip label={"Onboarded"} />,
    [CompanyStatus.CUSTOMER_TRAINING]: <TrainingChip label={"Training"} />,
    [CompanyStatus.PENDING_REVIEW]: <ReviewChip label={"Pending Review"} />
};

export const StatusCell = () => {
    // useTableRow() allows you to access the entire data of the current row.
    const { row } = useTableRow<Company>();

    // isFolderRow() allows for custom rendering when the current row is a folder.
    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    // Let's render the entry price.
    return <>{statusChips[row.companyStatus]}</>;
};
