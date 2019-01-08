// @flow
import * as React from "react";
import { renderPlugins } from "webiny-app/plugins";
import type { CmsPageDetailsPluginType, WithPageDetailsProps } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import styled from "react-emotion";
import { Elevation } from "webiny-ui/Elevation";
import PagePreview from "./PagePreview";

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0,
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    overflow: "scroll",
    padding: 25
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
            return <PagePreview pageDetails={pageDetails} />;
        }
    }
]: Array<CmsPageDetailsPluginType>);
