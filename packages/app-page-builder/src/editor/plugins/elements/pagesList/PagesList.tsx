import React from "react";
import { PbEditorElement } from "~/types";
import PePagesList from "./PePagesList";
import PbPagesList from "./PbPagesList";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface PagesListProps {
    element: PbEditorElement;
}

const PagesList: React.FC<PagesListProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbPagesList {...props} data={props.element.data as any} />;
    }
    return <PePagesList element={props.element as Element} />;
};

export default React.memo(PagesList);
