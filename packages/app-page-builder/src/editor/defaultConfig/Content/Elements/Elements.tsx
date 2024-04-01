import React, { useRef } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import { PbEditorElement, PbTheme } from "~/types";
import { uiAtom, rootElementAtom, elementsAtom } from "~/editor/recoil/modules";

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

export const Elements = () => {
    // TODO: When merging into `next`, for 5.40.0 release, take the changes from `next`!
    const rootElementId = useRecoilValue(rootElementAtom);
    const rootElement = useRecoilValue(elementsAtom(rootElementId)) as PbEditorElement;
    const [{ displayMode }] = useRecoilState(uiAtom);
    const pagePreviewRef = useRef<HTMLDivElement>(null);

    return (
        <ContentContainer
            className={`mdc-elevation--z1 webiny-pb-editor-device--${kebabCase(
                displayMode
            )} webiny-pb-media-query--${kebabCase(displayMode)}`}
            style={{ minHeight: "calc(100vh - 230px)" }}
        >
            <BaseContainer ref={pagePreviewRef} className={"webiny-pb-editor-content-preview"}>
                <PeElement element={rootElement as ElementType} />
            </BaseContainer>
        </ContentContainer>
    );
};
