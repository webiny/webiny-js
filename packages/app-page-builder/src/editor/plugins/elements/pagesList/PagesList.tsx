import React from "react";
import {PbEditorElement} from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PePagesList from "./PePagesList";
import PbPagesList from "./PbPagesList";

interface PagesListProps {
    element: PbEditorElement;
}

const PagesList: React.FC<PagesListProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PePagesList {...props} />;
    }
    return <PbPagesList {...props} data={props.element.data as any} />;
};

export default React.memo(PagesList);
