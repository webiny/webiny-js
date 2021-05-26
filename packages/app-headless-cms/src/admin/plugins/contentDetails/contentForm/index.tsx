import * as React from "react";
import { css } from "emotion";
import { renderPlugins } from "@webiny/app/plugins";
import { Tab } from "@webiny/ui/Tabs";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import ContentForm from "./ContentForm";

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0,
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    /*overflow: "scroll",*/
    padding: 25
});

const elevationStyles = css({
    position: "relative"
});

const plugins = [
    {
        name: "cms-content-details-revision-content-preview",
        type: "cms-content-details-revision-content",
        render(props) {
            return (
                <Tab
                    label={"Content"}
                    disabled={props.getLoading()}
                    data-testid={"cms.content-form.tabs.content"}
                >
                    <RenderBlock>
                        <Elevation z={2} className={elevationStyles}>
                            {props.getLoading() && <CircularProgress />}
                            {renderPlugins("cms-content-details-revision-content-preview", props)}
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
