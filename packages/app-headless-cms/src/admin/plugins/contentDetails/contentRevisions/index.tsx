import * as React from "react";
import { Tab } from "@webiny/ui/Tabs";
import { CmsContentDetailsRevisionContentPlugin } from "@webiny/app-headless-cms/types";
import RevisionsList from "./RevisionsList";

const plugin: CmsContentDetailsRevisionContentPlugin = {
    name: "cms-content-details-revision-content-revisions",
    type: "cms-content-details-revision-content",
    render(props) {
        return (
            <Tab label={"Revisions"} disabled={props.getLoading()}>
                <RevisionsList {...props} />
            </Tab>
        );
    }
};

export default plugin;
