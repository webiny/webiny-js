import React from "react";
import { makeDecoratable } from "@webiny/react-composition";

export const SingleEntryFormContent = makeDecoratable(
    "SingleEntryContent",
    ({ children }: React.PropsWithChildren) => {
        return <>{children}</>;
    }
);
