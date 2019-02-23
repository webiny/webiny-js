// @flow
import * as React from "react";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import RevisionsList from "./RevisionsList";

export default ({
    name: "cms-page-details-revision-content-revisions",
    type: "cms-page-details-revision-content",
    render({ pageDetails, loading }: WithPageDetailsProps) {
        return (
            <Tab label={"Revisions"} disabled={loading}>
                <RevisionsList pageDetails={pageDetails} loading={loading} />
            </Tab>
        );
    }
}: CmsPageDetailsPluginType);
