//@flow
import * as React from "react";
import { css } from "emotion";
import styled from "react-emotion";
import { Typography } from "webiny-ui/Typography";
import { Select } from "webiny-ui/Select";
import RenderElement from "webiny-app-cms/render/components/Element";
import Zoom from "./Zoom";

const pageInnerWrapper = css({
    overflowY: "scroll",
    overflowX: "hidden",
    height: "calc(100vh - 230px)",
    position: "relative",
    ".webiny-cms-page-document": {
        transform: "scale(var(--webiny-cms-page-preview-scale))",
        transition: "transform 0.5s ease-in-out",
        transformOrigin: "top center"
    }
});

const PagePreviewToolbar = styled("div")({
    position: "sticky",
    bottom: 0,
    height: 30,
    paddingLeft: 15,
    color: "var(--mdc-theme-text-secondary-on-background)",
    borderTop: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "var(--mdc-theme-background)",
    width: "100%",
    transform: "translateZ(0)",
    display: "flex",
    overflow: "hidden",
    select: {
        fontSize: 14,
        color: "var(--mdc-theme-text-secondary-on-background)",
        width: 75
    }
});

type Props = {
    pageDetails: Object
};

const PagePreview = ({ pageDetails }: Props) => {
    return (
        <Zoom>
            {({ zoom, setZoom }) => (
                <div
                    className={pageInnerWrapper}
                    style={{ "--webiny-cms-page-preview-scale": zoom }}
                >
                    <RenderElement element={pageDetails.page.content} />
                    <PagePreviewToolbar>
                        <span>
                            <Typography use={"overline"}>Zoom:&nbsp;</Typography>
                        </span>
                        <Select value={zoom.toString()} onChange={setZoom}>
                            <option value={"1"}>100%</option>
                            <option value={"0.75"}>75%</option>
                            <option value={"0.5"}>50%</option>
                        </Select>
                    </PagePreviewToolbar>
                </div>
            )}
        </Zoom>
    );
};

export default PagePreview;
