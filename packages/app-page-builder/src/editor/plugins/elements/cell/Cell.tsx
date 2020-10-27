import React from "react";
import Element from "@webiny/app-page-builder/editor/components/Element";
import styled from "@emotion/styled";
import { PbShallowElement } from "@webiny/app-page-builder/types";

const CellStyle = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box",
    flexGrow: 1,
    width: `100%`,
    border: "1px dashed gray",
    " > div": {
        width: "100%"
    }
});

type CellPropsType = {
    element: PbShallowElement;
};
const Cell: React.FunctionComponent<CellPropsType> = ({ element }) => {
    return (
        <CellStyle>
            {element.elements.map(childId => {
                return <Element id={childId} key={`cell-child-${childId}`} />;
            })}
        </CellStyle>
    );
};

export default React.memo(Cell, (prev, next) => {
    return prev.element.id === next.element.id;
});
