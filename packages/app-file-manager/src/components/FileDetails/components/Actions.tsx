import React from "react";
import { useFileManagerViewConfig } from "~/index.js";

export const Actions = () => {
    const { fileDetails } = useFileManagerViewConfig();

    return (
        <div className={"flex justify-start gap-xs"}>
            {fileDetails.actions.map(action => (
                <React.Fragment key={action.name}>{action.element}</React.Fragment>
            ))}
        </div>
    );
};
