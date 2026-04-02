import React from "react";
import { Admin } from "webiny/extensions";

export const CommandPalette = () => {
    return (
        <>
            <Admin.Extension
                src={"@/extensions/commandPalette/commands/simpleCommand/SimpleCommand.tsx"}
            />
            <Admin.Extension
                src={"@/extensions/commandPalette/commands/formCommand/FormCommand.tsx"}
            />
        </>
    );
};
