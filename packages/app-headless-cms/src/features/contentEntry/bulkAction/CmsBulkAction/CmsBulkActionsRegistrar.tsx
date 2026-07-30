import React, { useEffect, useRef, useState } from "react";
import { useContainer } from "@webiny/app";
import { Browser } from "~/admin/config/contentEntries/list/Browser/index.js";
import { CmsBulkAction } from "./abstractions.js";
import { CmsBulkActionToolbarButton } from "./CmsBulkActionToolbarButton.js";
import { createNotificationHandler } from "./createNotificationHandler.js";

/**
 * Resolves every registered `CmsBulkAction` implementation and wires it into the framework:
 *
 *  - contributes a `<Browser.BulkAction>` toolbar entry (name + modelIds + generated button)
 *    to the content entry list config, and
 *  - registers one generated `WebsocketEventHandler` per `notifications` entry, so the
 *    per-entry toasts arrive over websockets without any hand-written handler.
 *
 * Users only register their implementation (via `CmsBulkAction.createImplementation` +
 * `<RegisterFeature>`); this registrar is mounted once by the framework.
 *
 * Resolution runs in an effect (after the first commit) so it observes implementations
 * registered anywhere in the initial render tree, regardless of render order relative to
 * this component.
 */
export const CmsBulkActionsRegistrar = () => {
    const container = useContainer();
    const [actions, setActions] = useState<CmsBulkAction.Interface[]>([]);
    const registeredNotifications = useRef(false);

    useEffect(() => {
        const resolved = container.resolveAll(CmsBulkAction);

        if (!registeredNotifications.current) {
            registeredNotifications.current = true;
            resolved.forEach(action => {
                const notifications = action.notifications;
                if (!notifications) {
                    return;
                }
                Object.entries(notifications).forEach(([actionKey, build]) => {
                    container.register(createNotificationHandler(actionKey, build));
                });
            });
        }

        setActions(resolved);
    }, [container]);

    return (
        <>
            {actions.map(action => (
                <Browser.BulkAction
                    key={action.name}
                    name={action.name}
                    modelIds={action.modelIds}
                    element={<CmsBulkActionToolbarButton action={action} />}
                />
            ))}
        </>
    );
};
