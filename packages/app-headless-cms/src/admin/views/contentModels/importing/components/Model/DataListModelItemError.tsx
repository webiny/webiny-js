import React, { useCallback, useState } from "react";
import styled from "@emotion/styled";
import { CmsErrorResponse } from "~/types";
import { InvalidField } from "~/admin/views/contentModels/importing/types";

const Note = styled("div")({
    color: "var(--mdc-theme-error)",
    fontSize: "10px"
});

const MoreInformation = styled("a")({
    color: "var(--mdc-theme-error)",
    fontSize: "9px",
    cursor: "pointer",
    margin: "0 0 0 auto"
});

const Container = styled("div")({
    padding: "0",
    margin: "0",
    lineHeight: "10px"
});

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
            return <Note>{error.message}</Note>;
        }
        return (
            <Note>
                Missing invalidFields information. Please check the network tab in your
                browser&apos;s developer tools for more details.
            </Note>
        );
    }

    return (
        <Container>
            <MoreInformation onClick={toggleContainer}>
                {expanded
                    ? "Collapse"
                    : "Validation failed. Click to expand to see more information..."}
            </MoreInformation>
            <InvalidFields invalidFields={invalidFields} expanded={expanded} />
        </Container>
    );
};
