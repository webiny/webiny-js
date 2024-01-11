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
    elementsAtom,
    PagePreviewDimension
} from "~/editor/recoil/modules";
import { EditorContent } from "~/editor";

import { Element as PeElement } from "@webiny/app-page-builder-elements";
import { Element as ElementType } from "@webiny/app-page-builder-elements/types";

const BREADCRUMB_HEIGHT = 33;

interface ContentContainerParams {
    theme?: PbTheme | null;
}

const LegacyContentContainer = styled.div(({ theme }: ContentContainerParams) => {
    const backgroundColor = theme?.colors?.background;
    return {
        backgroundColor,
        position: "relative",
        margin: "0 auto",
        ".webiny-pb-page-document, pb-document": {
            overflowY: "visible", // cuts off the block selector tooltip
            overflowX: "visible",
            // We need this extra spacing so that editor content won't get cutoff
            paddingBottom: BREADCRUMB_HEIGHT
        }
    };
});

// TODO: For now, these dimensions are hardcoded.
// TODO: At some point in future, we might want to expose these.
const ContentContainer = styled(LegacyContentContainer)`
    &.webiny-pb-editor-device--desktop {
        max-width: 100%;
    }

    &.webiny-pb-editor-device--tablet {
        max-width: 768px;
    }

    &.webiny-pb-editor-device--mobile-landscape {
        max-width: 568px;
    }

    &.webiny-pb-editor-device--mobile-portrait {
        max-width: 320px;
    }
`;

const contentContainerWrapper = css({
    margin: "95px 65px 50px 85px",
    padding: 0,
    position: "absolute",
    width: "calc(100vw - 115px - 300px)",
    top: 0,
    boxSizing: "border-box",
    zIndex: 1
});

const LegacyBaseContainer = styled.div`
    width: 100%;
    left: 52px;
    margin: 0 auto;
`;

const BaseContainer = styled(LegacyBaseContainer)`
    /* The usage of containers (the "@container" CSS at-rule) enables us to have responsive */
    /* design not only on the actual website, but also within the Page Builder's page editor. */
    /* Note that on the actual website, regular media queries are being used. */
    container-type: inline-size;
    container-name: page-editor-canvas;
`;

const Content = () => {
    const rootElementId = useRecoilValue(rootElementAtom);
    const rootElement = useRecoilValue(elementsAtom(rootElementId)) as PbEditorElement;
    const [{ displayMode }, setUiAtomValue] = useRecoilState(uiAtom);
    const pagePreviewRef = useRef<HTMLDivElement>(null);

    const setPagePreviewDimension = useCallback(
        (pagePreviewDimension: PagePreviewDimension) => {
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

    return (
        <Elevation className={contentContainerWrapper} z={0}>
            <ContentContainer
                className={`mdc-elevation--z1 webiny-pb-editor-device--${kebabCase(
                    displayMode
                )} webiny-pb-media-query--${kebabCase(displayMode)}`}
                style={{ minHeight: "calc(100vh - 230px)" }}
            >
                <EditorContent />
                <BaseContainer ref={pagePreviewRef} className={"webiny-pb-editor-content-preview"}>
                    <PeElement element={rootElement as ElementType} />
                </BaseContainer>
            </ContentContainer>
        </Elevation>
    );
};

export default Content;
