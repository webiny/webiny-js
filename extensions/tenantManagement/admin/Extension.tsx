import React from "react";
import { AdminConfig } from "webiny/admin";
import { useRouter } from "webiny/admin/router";
import { Routes } from "webiny/admin/cms";

import { TenantEntryList } from "./TenantEntryList.js";
import { CurrentTenantProvider } from "./CurrentTenantProvider.js";

const { Menu } = AdminConfig;

export const Extension = () => {
    const { getLink } = useRouter();
    return (
        <>
            <CurrentTenantProvider />
            <TenantEntryList />
            <AdminConfig>
                <Menu
                    name="tenantManager"
                    element={
                        <Menu.Link
                            text="Tenant Manager"
                            to={getLink(Routes.ContentEntries.List, { modelId: "tenant" })}
                        />
                    }
                />
            </AdminConfig>
        </>
    );
};
