import React from "react";
import { useFileManagerConfig } from "~/index.js";

export const Actions = () => {
    const { fileDetails } = useFileManagerConfig();

    return (
        <div className={"flex justify-start gap-xs"}>
            {fileDetails.actions.map(action => (
                <React.Fragment key={action.name}>{action.element}</React.Fragment>
            ))}
        </div>
    );
};
