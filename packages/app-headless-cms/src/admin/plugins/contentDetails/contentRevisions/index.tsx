import * as React from "react";
import { Tab } from "@webiny/ui/Tabs";
import { CmsContentDetailsRevisionContentPlugin } from "~/types";
import RevisionsList from "./RevisionsList";

const plugin: CmsContentDetailsRevisionContentPlugin = {
    name: "cms-content-details-revision-content-revisions",
    type: "cms-content-details-revision-content",
    render(props) {
        return (
            <Tab
                label={"Revisions"}
                disabled={props.getLoading()}
                data-testid={"cms.content-form.tabs.revisions"}
            >
                <RevisionsList {...props} />
            </Tab>
        );
    }
};

export default plugin;
