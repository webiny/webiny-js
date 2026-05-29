import React from "react";
import { Layout } from "~/modules/redirects/RedirectsList/components/Layout/index.js";
import { Main } from "~/modules/redirects/RedirectsList/components/Main/index.js";
import { Sidebar } from "~/modules/redirects/RedirectsList/components/Sidebar/index.js";
import { CreateRedirectDialog } from "~/modules/redirects/RedirectsList/components/CreateRedirectDialog.js";
import { EditRedirectDialog } from "~/modules/redirects/RedirectsList/components/EditRedirectDialog.js";

export const DocumentList = () => {
    return (
        <>
            <Layout main={<Main />} sidebar={<Sidebar />} />
            <CreateRedirectDialog />
            <EditRedirectDialog />
        </>
    );
};
