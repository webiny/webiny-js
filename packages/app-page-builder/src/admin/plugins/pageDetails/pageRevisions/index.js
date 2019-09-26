// @flow
import * as React from "react";
import { Tab } from "@webiny/ui/Tabs";
import RevisionsList from "./RevisionsList";

export default {
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
