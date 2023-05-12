import React from "react";
import styled from "@emotion/styled";
import DropZone from "../../../components/DropZone";
import Element from "../../../components/Element";
import { DragObjectWithTypeWithTarget } from "../../../components/Droppable";

const CellStyle = styled("div")({
    position: "relative"
});
interface CellPropsType {
    id: string;
    dropElement: (source: DragObjectWithTypeWithTarget, index: number) => void;
    type: string;
    index: number;
    isLast?: boolean;
}
const PbCell: React.FC<CellPropsType> = ({ id, dropElement, index, isLast = false, type }) => {
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

export default React.memo(PbCell);
