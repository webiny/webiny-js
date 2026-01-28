import React from "react";
import { TenantEntryList } from "./TenantEntryList.js";
import { CurrentTenantProvider } from "./CurrentTenantProvider.js";

export const Extension = () => {
    return (
        <>
            <CurrentTenantProvider />
            <TenantEntryList />
        </>
    );
};
