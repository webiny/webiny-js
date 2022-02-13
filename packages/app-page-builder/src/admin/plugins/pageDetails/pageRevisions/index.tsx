import * as React from "react";
import { Tab } from "@webiny/ui/Tabs";
import { PbPageDetailsRevisionContentPlugin } from "~/types";
import RevisionsList from "./RevisionsList";

const plugin: PbPageDetailsRevisionContentPlugin = {
    name: "pb-page-details-revision-content-revisions",
    type: "pb-page-details-revision-content",
    render(props) {
        return (
            <Tab label={"Revisions"} disabled={props.getPageQuery.loading}>
                <RevisionsList {...props} />
            </Tab>
        );
    }
};

export default plugin;
