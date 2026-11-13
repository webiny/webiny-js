import React from "react";
import { Layout } from "~/modules/redirects/RedirectsList/components/Layout/index.js";
import { Main } from "~/modules/redirects/RedirectsList/components/Main/index.js";
import { Sidebar } from "~/modules/redirects/RedirectsList/components/Sidebar/index.js";
import { DocumentListPresenterProvider } from "~/modules/redirects/RedirectsList/presenters/DocumentListPresenterContext.js";
import { useDocumentListController } from "~/modules/redirects/RedirectsList/useDocumentList.js";

/**
 * Separate component because the controller reads the presenter from context, so it has to run
 * below the provider.
 */
const DocumentListContent = () => {
    useDocumentListController();

    return <Layout main={<Main />} sidebar={<Sidebar />} />;
};

export const DocumentList = () => {
    return (
        <DocumentListPresenterProvider>
            <DocumentListContent />
        </DocumentListPresenterProvider>
    );
};
