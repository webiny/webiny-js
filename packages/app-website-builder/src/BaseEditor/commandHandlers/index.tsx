import React from "react";
import { CloneElement } from "./CloneElement.js";
import { CreateElement } from "./CreateElement.js";
import { DeleteElement } from "./DeleteElement.js";
import { MoveElement } from "./MoveElement.js";
import { DeselectElement } from "./DeselectElement.js";
import { SelectElement } from "./SelectElement.js";
import { HighlightElement } from "./HighlightElement.js";

export const CommandHandlers = React.memo(() => {
    return (
        <>
            <CloneElement />
            <CreateElement />
            <DeleteElement />
            <MoveElement />
            <DeselectElement />
            <SelectElement />
            <HighlightElement />
        </>
    );
});

CommandHandlers.displayName = "CommandHandlers";
