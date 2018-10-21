// @flow
import * as React from "react";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import RenderElement from "webiny-app-cms/render/components/Element";
import styled from "react-emotion";

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0
});

export default ({
    name: "cms-page-details-revision-content-preview",
    type: "cms-page-details-revision-content",
    render({ pageDetails }: WithPageDetailsProps) {
        return (
            <Tab label={"Page preview"}>
                <RenderBlock>
                    <RenderElement element={pageDetails.revision.data.content} />
                </RenderBlock>
            </Tab>
        );
    }
}: CmsPageDetailsPluginType);
