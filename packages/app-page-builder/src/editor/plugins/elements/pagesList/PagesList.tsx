import React from "react";
import { PbEditorElement } from "~/types";
import PePagesList from "./PePagesList";
import PbPagesList from "./PbPagesList";
import { isLegacyRenderingEngine } from "~/utils";

interface PagesListProps {
    element: PbEditorElement;
}

const PagesList: React.FC<PagesListProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbPagesList {...props} data={props.element.data as any} />;
    }
    return <PePagesList {...props} />;
};

export default React.memo(PagesList);
