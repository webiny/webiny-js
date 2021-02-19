import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import {
    PbPageDetailsRevisionContentPlugin,
    PbPageDetailsRevisionContentPreviewPlugin
} from "@webiny/app-page-builder/types";
import { Tab } from "@webiny/ui/Tabs";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import PagePreview from "./PagePreview";
import { CircularProgress } from "@webiny/ui/Progress";

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0,
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    overflow: "auto",
    padding: 25
});

const plugins = [
    {
        name: "pb-page-details-revision-content-preview",
        type: "pb-page-details-revision-content",
        render(props) {
            const { loading } = props;

            return (
                <Tab label={"Page preview"} disabled={loading}>
                    <RenderBlock>
                        <Elevation z={2}>
                            <div style={{ position: "relative" }}>
                                {loading && <CircularProgress />}
                                {renderPlugins("pb-page-details-revision-content-preview", props)}
                            </div>
                        </Elevation>
                    </RenderBlock>
                </Tab>
            );
        }
    } as PbPageDetailsRevisionContentPlugin,
    {
        name: "pb-page-details-revision-preview",
        type: "pb-page-details-revision-content-preview",
        render(props) {
            return <PagePreview {...props} />;
        }
    } as PbPageDetailsRevisionContentPreviewPlugin
];

export default plugins;
