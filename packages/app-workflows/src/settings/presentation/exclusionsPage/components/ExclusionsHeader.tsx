import React from "react";
import { FormComponentDescription } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { EXCLUSIONS_PAGE_SUB } from "../exclusionsCopy.js";
import { EXCLUSIONS_PAGE_TITLE } from "../exclusionsCopy.js";

// The page title and sub line, always shown. Add exclusion lives in the toolbar (R329).
export const ExclusionsHeader = () => {
    return (
        <div className="flex flex-col gap-xs pt-md px-lg pb-md">
            <Heading level={4} as="h1">
                {EXCLUSIONS_PAGE_TITLE}
            </Heading>
            <FormComponentDescription className="mb-0" text={EXCLUSIONS_PAGE_SUB} />
        </div>
    );
};
