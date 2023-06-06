import React from "react";
import { createRenderer } from "@webiny/app-page-builder-elements";

// The renderer React component.
export const DroppableElement1 = createRenderer(() => {
    return (
        <div>
            <h1>Droppable Element 1</h1>
            <p>This is droppable element 1.</p>
        </div>
    );
});
