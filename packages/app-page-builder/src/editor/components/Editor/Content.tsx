import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import styled from "@emotion/styled";
import { css } from "emotion";
import kebabCase from "lodash/kebabCase";
import { Elevation } from "@webiny/ui/Elevation";
import { PbEditorElement, PbTheme } from "~/types";
import {
    uiAtom,
    setPagePreviewDimensionMutation,
    rootElementAtom,
    elementsAtom
} from "~/editor/recoil/modules";

import { usePageBuilder } from "~/hooks/usePageBuilder";
import Element from "../Element";
import { EditorContent } from "~/editor";

const BREADCRUMB_HEIGHT = 33;
interface ContentContainerParams {
    theme: PbTheme | null;
}
const ContentContainer = styled("div")(({ theme }: ContentContainerParams) => {
    const backgroundColor = theme?.colors?.background;
    return {
        backgroundColor,
        position: "relative",
        margin: "0 auto",
        ".webiny-pb-page-document": {
            overflowY: "visible", // cuts off the block selector tooltip
            overflowX: "visible",
            // We need this extra spacing so that editor content won't get cutoff
            paddingBottom: BREADCRUMB_HEIGHT
        }
    };
});
const contentContainerWrapper = css({
    margin: "95px 65px 50px 85px",
    padding: 0,
    position: "absolute",
    width: "calc(100vw - 115px - 300px)",
    top: 0,
    boxSizing: "border-box",
    zIndex: 1
});
const BaseContainer = styled("div")({
    width: "100%",
    left: 52,
    margin: "0 auto"
});

const Content: React.FC = () => {
    const rootElementId = useRecoilValue(rootElementAtom);
    const rootElement = useRecoilValue(elementsAtom(rootElementId)) as PbEditorElement;
    const [{ displayMode }, setUiAtomValue] = useRecoilState(uiAtom);
    const pagePreviewRef = useRef<HTMLDivElement>(null);

    const setPagePreviewDimension = useCallback(
        pagePreviewDimension => {
            setUiAtomValue(prev => setPagePreviewDimensionMutation(prev, pagePreviewDimension));
        },
        [uiAtom]
    );

    const resizeObserver = useMemo(() => {
        return new ResizeObserver((entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setPagePreviewDimension({ width, height });
            }
        });
    }, []);

    // Set resize observer
    useEffect(() => {
        if (pagePreviewRef.current) {
            // Add resize observer
            resizeObserver.observe(pagePreviewRef.current);
        }

        // Cleanup
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const { theme } = usePageBuilder();

    return (
        <Elevation className={contentContainerWrapper} z={0}>
            <ContentContainer
                theme={theme as any}
                className={`mdc-elevation--z1 webiny-pb-editor-device--${kebabCase(
                    displayMode
                )} webiny-pb-media-query--${kebabCase(displayMode)}`}
            >
                <EditorContent />
                <BaseContainer ref={pagePreviewRef} className={"webiny-pb-editor-content-preview"}>
                    <Element id={rootElement.id} />
                </BaseContainer>
            </ContentContainer>
        </Elevation>
    );
};

export default Content;
