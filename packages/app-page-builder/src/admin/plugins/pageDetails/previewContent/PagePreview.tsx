import React, { CSSProperties } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import classNames from "classnames";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { Page } from "@webiny/app-page-builder-elements/components/Page";
import { Zoom } from "./Zoom";
import { PbPageData } from "~/types";
import useResponsiveClassName from "~/hooks/useResponsiveClassName";
import RenderElement from "~/render/components/Element";
import { isLegacyRenderingEngine } from "~/utils";

const webinyZoomStyles = css`
    &.mdc-select--no-label:not(.mdc-select--outlined)
        .mdc-select__anchor
        .mdc-select__selected-text {
        padding-top: 0;
    }
`;

const pageInnerWrapper = css({
    overflowY: "scroll",
    overflowX: "hidden",
    height: "calc(100vh - 230px)",
    position: "relative",
    '.webiny-pb-page-document, [data-pb-element-type="document"]': {
        transform: "scale(var(--webiny-pb-page-preview-scale))",
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
    ".webiny-ui-select": {
        color: "var(--mdc-theme-text-secondary-on-background)",
        backgroundColor: "transparent !important",
        width: "120px !important",
        ".mdc-select__dropdown-icon": {
            display: "none"
        },
        select: {
            fontSize: 14,
            border: "none",
            height: 30,
            padding: 0,
            backgroundColor: "transparent !important"
        }
    }
});

interface PagePreviewInnerProps {
    zoom: number;
    setZoom: (zoom: number) => void;
}

const SelectPageZoom: React.ComponentType<PagePreviewInnerProps> = ({ zoom, setZoom }) => (
    <PagePreviewToolbar>
        <span>
            <Typography use={"overline"}>Zoom:&nbsp;</Typography>
        </span>
        <Select value={zoom.toString()} onChange={setZoom} className={webinyZoomStyles}>
            <option value={"1"}>100%</option>
            <option value={"0.75"}>75%</option>
            <option value={"0.5"}>50%</option>
        </Select>
    </PagePreviewToolbar>
);

interface PagePreviewProps {
    page: PbPageData;
    getPageQuery: Function;
}

const PagePreview: React.FC<PagePreviewProps> = ({ page }) => {
    if (isLegacyRenderingEngine) {
        const { pageElementRef, responsiveClassName } = useResponsiveClassName();
        return (
            <Zoom>
                {({ zoom, setZoom }) => (
                    <div
                        ref={pageElementRef}
                        className={classNames(pageInnerWrapper, responsiveClassName)}
                        style={{ "--webiny-pb-page-preview-scale": zoom } as CSSProperties}
                    >
                        <RenderElement key={page.id} element={page.content} />
                        <SelectPageZoom zoom={zoom} setZoom={setZoom} />
                    </div>
                )}
            </Zoom>
        );
    }

    return (
        <Zoom>
            {({ zoom, setZoom }) => (
                <div
                    className={pageInnerWrapper}
                    style={{ "--webiny-pb-page-preview-scale": zoom } as CSSProperties}
                >
                    <Page page={page} />
                    <SelectPageZoom zoom={zoom} setZoom={setZoom} />
                </div>
            )}
        </Zoom>
    );
};

export default PagePreview;
