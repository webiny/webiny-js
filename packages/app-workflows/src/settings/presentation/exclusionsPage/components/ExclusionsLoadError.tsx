import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as CloudOffIcon } from "@webiny/icons/cloud_off.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { EXCLUSIONS_LOAD_ERROR_TEXT } from "../exclusionsCopy.js";
import { EXCLUSIONS_LOAD_ERROR_TITLE } from "../exclusionsCopy.js";
import { EXCLUSIONS_TRY_AGAIN } from "../exclusionsCopy.js";

export interface ExclusionsLoadErrorProps {
    onRetry(): void;
}

/*
 * The list did not load (R322, frame 10; a server error shows the same, Copy gap 3). EmptyState
 * has no icon slot, so the design icon sits above it (R329).
 */
export const ExclusionsLoadError = ({ onRetry }: ExclusionsLoadErrorProps) => {
    return (
        <div data-testid="exclusions-load-error" className="flex flex-col items-center pt-xl">
            <Icon
                icon={<CloudOffIcon />}
                label=""
                size="lg"
                className="fill-destructive"
                data-icon="cloud_off"
            />
            <EmptyState
                illustration={false}
                title={EXCLUSIONS_LOAD_ERROR_TITLE}
                description={EXCLUSIONS_LOAD_ERROR_TEXT}
                actions={
                    <Button
                        variant="tertiary"
                        text={EXCLUSIONS_TRY_AGAIN}
                        icon={<RefreshIcon />}
                        onClick={() => onRetry()}
                    />
                }
            />
        </div>
    );
};
