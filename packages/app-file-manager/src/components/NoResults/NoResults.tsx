import React from "react";
import { i18n } from "@webiny/app/i18n";

import { NoResultsWrapper } from "./styled";

const t = i18n.ns("app-admin/file-manager/components/no-results");

export const NoResults = () => {
    return (
        <NoResultsWrapper>
            <div>{t`No results found.`}</div>
        </NoResultsWrapper>
    );
};
