import React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import {
    PbPageDetailsRevisionContentPlugin,
    PbPageDetailsRevisionContentPreviewPlugin
} from "~/types";
import { Tab } from "@webiny/ui/Tabs";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import { PagePreview } from "./PagePreview";
import { CircularProgress } from "@webiny/ui/Progress";

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0,
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    overflow: "auto",
    padding: 25
});

const detailsRevisionContentPlugin: PbPageDetailsRevisionContentPlugin = {
    name: "pb-page-details-revision-content-preview",
    type: "pb-page-details-revision-content",
    render(props) {
        const { getPageQuery } = props;

        return (
            <Tab label={"Page preview"} disabled={getPageQuery.loading}>
                <RenderBlock>
                    <Elevation z={2}>
                        <div style={{ position: "relative" }}>
                            {getPageQuery.loading && <CircularProgress />}
                            {renderPlugins("pb-page-details-revision-content-preview", props)}
                        </div>
                    </Elevation>
                </RenderBlock>
            </Tab>
        );
    }
};

const revisionContentPreviewPlugin: PbPageDetailsRevisionContentPreviewPlugin = {
    name: "pb-page-details-revision-preview",
    type: "pb-page-details-revision-content-preview",
    render(props) {
        return <PagePreview {...props} />;
    }
};

export default [detailsRevisionContentPlugin, revisionContentPreviewPlugin];
