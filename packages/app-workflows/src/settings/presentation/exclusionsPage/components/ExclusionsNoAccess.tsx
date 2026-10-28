import React from "react";
import { EmptyState } from "@webiny/admin-ui";
import { EXCLUSIONS_NO_ACCESS_TEXT } from "../exclusionsCopy.js";
import { EXCLUSIONS_NO_ACCESS_TITLE } from "../exclusionsCopy.js";

// Without the editor permission, or after a NotAuthorized answer (R329, frame 11, Q68.4).
export const ExclusionsNoAccess = () => {
    return (
        <div data-testid="exclusions-no-access" className="flex flex-col items-center pt-xl">
            <EmptyState
                type="content"
                title={EXCLUSIONS_NO_ACCESS_TITLE}
                description={EXCLUSIONS_NO_ACCESS_TEXT}
            />
        </div>
    );
};
