import { useMemo } from "react";
import { useContainer } from "@webiny/app";
import { ScheduledActionsPresenter } from "~/presentation/scheduledActions/abstractions.js";

/**
 * Resolves the shared ScheduledActionsPresenter — the source of scheduled-action state for the
 * Live column, the entry-form bar and the publish/unpublish dialog notices.
 */
export const useScheduledActionsPresenter = (): ScheduledActionsPresenter.Interface => {
    const container = useContainer();
    return useMemo(() => container.resolve(ScheduledActionsPresenter), [container]);
};
