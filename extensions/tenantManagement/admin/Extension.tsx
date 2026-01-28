import React from "react";
import { CompanyEntryList } from "./CompanyEntryList";
import { CurrentCompanyProvider } from "./CurrentCompanyProvider";

import {} from "webiny/api/logger";

export const Extension = () => {
    return (
        <>
            <CurrentCompanyProvider />
            <CompanyEntryList />
        </>
    );
};
