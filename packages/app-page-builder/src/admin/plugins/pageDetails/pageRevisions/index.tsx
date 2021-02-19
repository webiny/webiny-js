import * as React from "react";
import { Tab } from "@webiny/ui/Tabs";
import { PbPageDetailsRevisionContentPlugin } from "@webiny/app-page-builder/types";
import RevisionsList from "./RevisionsList";

const plugin: PbPageDetailsRevisionContentPlugin = {
    name: "pb-page-details-revision-content-revisions",
    type: "pb-page-details-revision-content",
    render(props) {
        return (
            <Tab label={"Revisions"} disabled={props.loading}>
                <RevisionsList {...props} />
            </Tab>
        );
    }
};

export default plugin;
