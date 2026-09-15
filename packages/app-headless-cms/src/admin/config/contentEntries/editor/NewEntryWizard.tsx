import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { IsApplicableToCurrentModel } from "~/admin/config/IsApplicableToCurrentModel.js";

export interface NewEntryWizardConfig {
    name: string;
    element: React.ReactElement;
}

export interface NewEntryWizardProps {
    name: string;
    before?: string;
    after?: string;
    modelIds?: string[];
    element: React.ReactElement;
}

export const NewEntryWizard = ({
    name,
    before,
    after,
    element,
    modelIds = []
}: NewEntryWizardProps) => {
    const getId = useIdGenerator("newEntryWizard");

    const placeBefore = before !== undefined ? getId(before) : undefined;
    const placeAfter = after !== undefined ? getId(after) : undefined;

    return (
        <IsApplicableToCurrentModel modelIds={modelIds}>
            <Property
                id={getId(name)}
                name={"newEntryWizards"}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "element")} name={"element"} value={element} />
            </Property>
        </IsApplicableToCurrentModel>
    );
};
