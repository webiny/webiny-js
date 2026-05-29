import React from "react";
import { Layout } from "./Layout/index.js";
import { Main } from "./Main/index.js";
import { Sidebar } from "./Sidebar/index.js";
import { CreateRedirectDialog } from "./CreateRedirectDialog.js";
import { EditRedirectDialog } from "./EditRedirectDialog.js";

export const DocumentList = () => {
    return (
        <>
            <Layout main={<Main />} sidebar={<Sidebar />} />
            <CreateRedirectDialog />
            <EditRedirectDialog />
        </>
    );
};
