import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { Element } from "@webiny/app-page-builder-elements/types";

interface PePagesListProps {
    element: PbEditorElement;
}

const PePagesList: React.FC<PePagesListProps> = props => {
    const { element } = props;
    const { renderers } = usePageElements();

    const PagesList = renderers["pages-list"];

    return <PagesList element={element as Element} />;
};
export default PePagesList;
