import React from "react";
import styled from "@emotion/styled";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import Element from "@webiny/app-page-builder/editor/components/Element";
import { DragObjectWithTypeWithTargetType } from "@webiny/app-page-builder/editor/components/Droppable";

const CellStyle = styled("div")({
    position: "relative"
});
type CellPropsType = {
    id: string;
    dropElement: (source: DragObjectWithTypeWithTargetType, index: number) => void;
    type: string;
    index: number;
    isLast?: boolean;
};
const Cell: React.FunctionComponent<CellPropsType> = ({
    id,
    dropElement,
    index,
    isLast = false,
    type
}) => {
    return (
        <CellStyle>
            <DropZone.Above type={type} onDrop={source => dropElement(source, index)} />
            <Element id={id} />
            {isLast && (
                <DropZone.Below type={type} onDrop={source => dropElement(source, index + 1)} />
            )}
        </CellStyle>
    );
};

export default React.memo(Cell);
