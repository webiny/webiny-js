// @flow
import * as React from "react";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import RenderElement from "webiny-app-cms/render/components/Element";

export default ({
    name: "cms-page-details-revision-content-preview",
    type: "cms-page-details-revision-content",
    render({ pageDetails }: WithPageDetailsProps) {
        return (
            <Tab label={"Page preview"}>
                <RenderElement element={pageDetails.revision.data.content} />
            </Tab>
        );
    }
}: CmsPageDetailsPluginType);
