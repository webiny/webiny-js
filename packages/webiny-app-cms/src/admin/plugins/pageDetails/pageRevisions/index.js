// @flow
import * as React from "react";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import RevisionsList from "./RevisionsList";

export default ({
    name: "cms-page-details-revision-content-revisions",
    type: "cms-page-details-revision-content",
    render({ pageDetails }: WithPageDetailsProps) {
        return (
            <Tab label={"Revisions"}>
                <RevisionsList pageDetails={pageDetails}/>
            </Tab>
        );
    }
}: CmsPageDetailsPluginType);
