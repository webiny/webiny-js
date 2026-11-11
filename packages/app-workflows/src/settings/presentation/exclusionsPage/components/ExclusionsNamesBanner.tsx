import React from "react";
import { Alert } from "@webiny/admin-ui";
import { EXCLUSIONS_NAMES_FAILED } from "../exclusionsCopy.js";
import { EXCLUSIONS_TRY_AGAIN } from "../exclusionsCopy.js";

export interface ExclusionsNamesBannerProps {
    onRetry(): void;
}

// The user name lookup failed; the rows show the ids until Try again resolves them (R321, Q68.1).
export const ExclusionsNamesBanner = ({ onRetry }: ExclusionsNamesBannerProps) => {
    return (
        <Alert
            type="danger"
            variant="subtle"
            data-testid="exclusions-names-banner"
            actions={<Alert.Action text={EXCLUSIONS_TRY_AGAIN} onClick={() => onRetry()} />}
        >
            <div>{EXCLUSIONS_NAMES_FAILED}</div>
        </Alert>
    );
};
