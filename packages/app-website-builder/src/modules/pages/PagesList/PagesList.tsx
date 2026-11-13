import React from "react";
import { Layout } from "~/modules/pages/PagesList/components/Layout/index.js";
import { Main } from "~/modules/pages/PagesList/components/Main/index.js";
import { Sidebar } from "~/modules/pages/PagesList/components/Sidebar/index.js";
import { useDocumentListController } from "~/modules/pages/PagesList/useDocumentList.js";

export const PagesList = () => {
    useDocumentListController();

    return <Layout main={<Main />} sidebar={<Sidebar />} />;
};
