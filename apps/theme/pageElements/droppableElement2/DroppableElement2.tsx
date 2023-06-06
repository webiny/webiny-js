import React from "react";
import { createRenderer } from "@webiny/app-page-builder-elements";

// The renderer React component.
export const DroppableElement2 = createRenderer(() => {
    return (
        <div>
            <h1>Droppable Element 2</h1>
            <p>This is droppable element 2.</p>
        </div>
    );
});
