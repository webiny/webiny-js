import React from "react";
import { Icon } from "@webiny/ui/Icon";
import { Elevation } from "@webiny/ui/Elevation";
import { ReactComponent as HandleIcon } from "./icons/round-drag_indicator-24px.svg";
import Draggable from "./Draggable";

const Field = ({ label, name }) => {
    return (
        <Draggable beginDrag={{ name }}>
            {({ connectDragSource }) => (
                <Elevation z={2}>
                    <div>
                        {label}{" "}
                        {connectDragSource(
                            <div>
                                <Icon icon={<HandleIcon />} />
                            </div>
                        )}
                    </div>
                </Elevation>
            )}
        </Draggable>
    );
};

export default Field;
