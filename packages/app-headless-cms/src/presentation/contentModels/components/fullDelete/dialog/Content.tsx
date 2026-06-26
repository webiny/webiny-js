import React from "react";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
import { FullyDeleteModelStateStatus } from "../types.js";
import { Information } from "./Information.js";
import { Confirmation } from "./Confirmation.js";
import { OverlayLoader } from "@webiny/admin-ui";
import { Processed } from "./Processed.js";

export interface IContentProps {
    model: CmsModel | null;
    confirmation: string;
    setConfirmation: (value: string) => void;
    error: CmsErrorResponse | null;
    status: FullyDeleteModelStateStatus;
}

export const Content = ({ confirmation, setConfirmation, error, model, status }: IContentProps) => {
    if (!model) {
        return <p>Model not found.</p>;
    } else if (status === FullyDeleteModelStateStatus.NONE) {
        return <Information model={model} />;
    } else if (status === FullyDeleteModelStateStatus.PROCESSED) {
        return <Processed model={model} />;
    }

    return (
        <>
            {status === FullyDeleteModelStateStatus.CONFIRMED && (
                <OverlayLoader text={"Starting the deletion process..."} />
            )}
            <Confirmation
                model={model}
                setConfirmation={setConfirmation}
                confirmation={confirmation}
                error={error}
            />
        </>
    );
};
