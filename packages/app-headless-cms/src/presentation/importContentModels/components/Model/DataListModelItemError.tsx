import React, { useCallback, useState } from "react";
import type { CmsErrorResponse } from "~/types.js";
import type { InvalidField } from "../../types.js";

interface InvalidFieldsProps {
    invalidFields: Record<string, InvalidField>;
    expanded: boolean;
}

const InvalidFields = ({ invalidFields, expanded }: InvalidFieldsProps) => {
    if (!expanded) {
        return null;
    }
    return (
        <>
            {Object.keys(invalidFields).map((key, index) => {
                const invalidField = invalidFields[key];
                return <div key={`invalid-field-${key}-${index}`}>{invalidField.message}</div>;
            })}
        </>
    );
};

interface DataListModelItemErrorProps {
    error: CmsErrorResponse;
}

export const DataListModelItemError = ({ error }: DataListModelItemErrorProps) => {
    const [expanded, setExpanded] = useState(false);

    const toggleContainer = useCallback(() => {
        setExpanded(!expanded);
    }, [expanded]);

    const invalidFields = error.data?.invalidFields;
    if (!invalidFields) {
        if (error.message) {
            return <div className={"text-[10px]"}>{error.message}</div>;
        }
        return (
            <div className={"text-[10px]"}>
                Missing invalidFields information. Please check the network tab in your
                browser&apos;s developer tools for more details.
            </div>
        );
    }

    return (
        <div className={"p-0 m-0 leading-[10px]"}>
            <a onClick={toggleContainer} className={"text-[9px] cursor-pointer ml-auto"}>
                {expanded
                    ? "Collapse"
                    : "Validation failed. Click to expand to see more information..."}
            </a>
            <InvalidFields invalidFields={invalidFields} expanded={expanded} />
        </div>
    );
};
