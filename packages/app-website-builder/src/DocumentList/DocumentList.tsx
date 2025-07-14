import React from "react";
import { Layout } from "~/DocumentList/components/Layout/index.js";
import { Main } from "~/DocumentList/components/Main/index.js";
import { Sidebar } from "~/DocumentList/components/Sidebar/index.js";
import { DocumentListPresenterProvider } from "~/DocumentList/presenters/DocumentListPresenterContext.js";

export const DocumentList = () => {
    return (
        <DocumentListPresenterProvider>
            <Layout main={<Main />} sidebar={<Sidebar />} />
        </DocumentListPresenterProvider>
    );
};
