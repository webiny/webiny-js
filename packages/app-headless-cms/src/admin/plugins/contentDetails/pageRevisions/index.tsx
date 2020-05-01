import * as React from "react";
import { Tab } from "@webiny/ui/Tabs";
import { CmsContentDetailsRevisionContentPlugin } from "@webiny/app-headless-cms/types";
import RevisionsList from "./RevisionsList";

const plugin: CmsContentDetailsRevisionContentPlugin = {
    name: "cms-content-details-revision-content-revisions",
    type: "cms-content-details-revision-content",
    render({ pageDetails, loading }) {
        return (
            <Tab label={"Revisions"} disabled={loading}>
                <RevisionsList pageDetails={pageDetails} loading={loading} />
            </Tab>
        );
    }
};

export default plugin;
