import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import { Tab } from "@webiny/ui/Tabs";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import ContentForm from "./ContentForm";

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0,
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    overflow: "scroll",
    padding: 25
});

const plugins = [
    {
        name: "cms-content-details-revision-content-preview",
        type: "cms-content-details-revision-content",
        render(props) {
            return (
                <Tab label={"Content"} disabled={props.loading}>
                    <RenderBlock>
                        <Elevation z={2}>
                            <div style={{ position: "relative" }}>
                                {renderPlugins(
                                    "cms-content-details-revision-content-preview",
                                    props
                                )}
                            </div>
                        </Elevation>
                    </RenderBlock>
                </Tab>
            );
        }
    },
    {
        name: "cms-content-details-content-form",
        type: "cms-content-details-revision-content-preview",
        render(props) {
            return <ContentForm {...props} />;
        }
    }
];

export default plugins;
