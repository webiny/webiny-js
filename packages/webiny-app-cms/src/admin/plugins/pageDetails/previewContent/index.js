// @flow
import * as React from "react";
import { renderPlugins } from "webiny-app/plugins";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import RenderElement from "webiny-app-cms/render/components/Element";
import styled from "react-emotion";
import { Elevation } from "webiny-ui/Elevation";

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0,
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    overflow: "scroll",
    padding: 25
});

const PageInnerWrapper = styled("div")({
    overflow: "scroll",
    height: "calc(100vh - 265px)",
    position: "relative"
});

export default ([
    {
        name: "cms-page-details-revision-content-preview",
        type: "cms-page-details-revision-content",
        render({ pageDetails }: WithPageDetailsProps) {
            return (
                <Tab label={"Page preview"}>
                    <RenderBlock>
                        <Elevation z={2}>
                            {renderPlugins("cms-page-details-revision-content-preview", {
                                pageDetails
                            })}
                        </Elevation>
                    </RenderBlock>
                </Tab>
            );
        }
    },
    {
        name: "cms-page-details-revision-render",
        type: "cms-page-details-revision-content-preview",
        render({ pageDetails }: WithPageDetailsProps) {
            return (
                <PageInnerWrapper>
                    <RenderElement element={pageDetails.page.content} />
                </PageInnerWrapper>
            );
        }
    }
]: Array<CmsPageDetailsPluginType>);
