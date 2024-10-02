import React from "react";
import { PbEditorElement } from "~/types";
import { PePagesList } from "./PePagesList";

import { Element } from "@webiny/app-page-builder-elements/types";

interface PagesListProps {
    element: PbEditorElement;
}

export const PagesList = (props: PagesListProps) => {
    const { element, ...rest } = props;
    return <PePagesList element={element as Element} {...rest} />;
};
