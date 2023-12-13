import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeList from "./PeList";

import { Element } from "@webiny/app-page-builder-elements/types";

interface ListProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const List = (props: ListProps) => {
    const { element, ...rest } = props;
    return <PeList element={element as Element} {...rest} />;
};

export default React.memo(List);
