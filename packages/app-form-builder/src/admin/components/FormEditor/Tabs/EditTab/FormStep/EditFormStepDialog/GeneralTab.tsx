import React from "react";
import { Input } from "@webiny/ui/Input";

export const GeneralTab = ({
    stepTitle,
    setStepTitle
}: {
    stepTitle: string;
    setStepTitle: (title: string) => void;
}) => {
    return (
        <div style={{ margin: "20px 20px" }}>
            <Input label="Change Step Title" value={stepTitle} onChange={setStepTitle} />
        </div>
    );
};
