// @flow
import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import type { PbPageDetailsPluginType, WithPageDetailsProps } from "@webiny/app-page-builder/types";
import { Tab } from "@webiny/ui/Tabs";
import styled from "react-emotion";
import { Elevation } from "@webiny/ui/Elevation";
import PagePreview from "./PagePreview";
import { CircularProgress } from "@webiny/ui/Progress";

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
        name: "pb-page-details-revision-content-preview",
        type: "pb-page-details-revision-content",
        render({ pageDetails, loading, refreshPages }: WithPageDetailsProps) {
            return (
                <Tab label={"Page preview"} disabled={loading}>
                    <RenderBlock>
                        <Elevation z={2}>
                            <div style={{ position: "relative" }}>
                                {loading && <CircularProgress />}
                                {renderPlugins("pb-page-details-revision-content-preview", {
                                    pageDetails,
                                    refreshPages
                                })}
                            </div>
                        </Elevation>
                    </RenderBlock>
                </Tab>
            );
        }
    },
    {
        name: "pb-page-details-revision-render",
        type: "pb-page-details-revision-content-preview",
        render({ pageDetails }: WithPageDetailsProps) {
            return <PagePreview pageDetails={pageDetails} />;
        }
    }
]: Array<PageBuilderPageDetailsPluginType>);
