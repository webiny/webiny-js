import React from "react";
import { Layout } from "~/modules/pages/PagesList/components/Layout/index.js";
import { Main } from "~/modules/pages/PagesList/components/Main/index.js";
import { Sidebar } from "~/modules/pages/PagesList/components/Sidebar/index.js";
import { DocumentListPresenterProvider } from "~/modules/pages/PagesList/presenters/DocumentListPresenterContext.js";

export const DocumentList = () => {
    return (
        <DocumentListPresenterProvider>
            <Layout main={<Main />} sidebar={<Sidebar />} />
        </DocumentListPresenterProvider>
    );
};
