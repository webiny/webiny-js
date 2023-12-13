import React from "react";
import { Icon } from "@webiny/ui/Icon";
import { Elevation } from "@webiny/ui/Elevation";
import { ReactComponent as HandleIcon } from "./icons/round-drag_indicator-24px.svg";
import Draggable from "./Draggable";

interface FieldProps {
    label: string;
    name: string;
}
const Field = ({ label, name }: FieldProps) => {
    return (
        <Draggable beginDrag={{ name }}>
            {({ drag }) => (
                <Elevation z={2}>
                    <div>
                        {label}{" "}
                        <div ref={drag}>
                            <Icon icon={<HandleIcon />} />
                        </div>
                    </div>
                </Elevation>
            )}
        </Draggable>
    );
};

export default Field;
