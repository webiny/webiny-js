import React from "react";
import { Property } from "@webiny/react-properties";
import { IsApplicableToCurrentModel } from "~/admin/config/IsApplicableToCurrentModel.js";

export interface NewEntryWizardProps {
    modelIds?: string[];
    element: React.ReactElement;
}

export const NewEntryWizard = ({ element, modelIds = [] }: NewEntryWizardProps) => {
    return (
        <IsApplicableToCurrentModel modelIds={modelIds}>
            <Property id="contentEntryForm:newEntryWizard" name="newEntryWizard" value={element} />
        </IsApplicableToCurrentModel>
    );
};
