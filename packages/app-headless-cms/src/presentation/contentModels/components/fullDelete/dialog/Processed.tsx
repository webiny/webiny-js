import React, { useMemo } from "react";
import type { CmsModel } from "~/types.js";

export interface IProcessedProps {
    model: CmsModel;
}

export const Processed = (props: IProcessedProps) => {
    const { model } = props;

    const conditionalMessage = useMemo(() => {
        if (model.plugin) {
            return "The entries will be deleted, but the model will remain in the system.";
        }
        return "When all the entries and the model are deleted, it will disappear from the UI.";
    }, [model.plugin]);

    return (
        <>
            <p>
                The model <strong>{model.name}</strong> deletion process was started.
            </p>
            <p>
                <br />
            </p>
            <p>
                If the model has a large amount of entries, it will take some time to delete
                everything.
            </p>
            <p>
                <br />
            </p>
            <p>{conditionalMessage}</p>
        </>
    );
};
