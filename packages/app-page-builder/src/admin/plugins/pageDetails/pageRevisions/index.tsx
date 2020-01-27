import * as React from "react";
import { Tab } from "@webiny/ui/Tabs";
import { PbPageDetailsRevisionContentPlugin } from "@webiny/app-page-builder/types";
import RevisionsList from "./RevisionsList";

const plugin: PbPageDetailsRevisionContentPlugin = {
    name: "pb-page-details-revision-content-revisions",
    type: "pb-page-details-revision-content",
    render({ pageDetails, loading }) {
        return (
            <Tab label={"Revisions"} disabled={loading}>
                <RevisionsList pageDetails={pageDetails} loading={loading} />
            </Tab>
        );
    }
};

export default plugin;
