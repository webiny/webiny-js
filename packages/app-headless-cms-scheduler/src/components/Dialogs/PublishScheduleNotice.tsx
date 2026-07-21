import React, { useEffect, useState } from "react";
import { Alert } from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import {
    PublishEntryConfirmDialogExtra,
    useModel
} from "@webiny/app-headless-cms/exports/admin/cms.js";
import { GetScheduledActionGateway } from "@webiny/app-scheduler/features/getScheduledAction/abstractions.js";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import type { SchedulerEntry } from "@webiny/app-scheduler/types.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { createNamespace, formatScheduledDate } from "~/utils/index.js";

/**
 * Decorates the "Publish entry" dialog to warn that publishing now will cancel an existing
 * scheduled action for the entry (the API cancels it on publish).
 */
export const PublishScheduleNoticeDecorator = PublishEntryConfirmDialogExtra.createDecorator(
    Original => {
        return function PublishEntryScheduleNotice(props: { entry: CmsContentEntry }) {
            const { model } = useModel();
            const container = useContainer();
            const [scheduled, setScheduled] = useState<SchedulerEntry | null>(null);

            const entryId = props.entry?.id;
            const modelId = model?.modelId;

            useEffect(() => {
                if (!entryId || !modelId) {
                    setScheduled(null);
                    return;
                }

                let cancelled = false;
                const gateway = container.resolve(GetScheduledActionGateway);
                gateway
                    .execute({ namespace: createNamespace({ modelId }), id: entryId })
                    .then(result => {
                        if (!cancelled) {
                            setScheduled(result);
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        if (!cancelled) {
                            setScheduled(null);
                        }
                    });

                return () => {
                    cancelled = true;
                };
            }, [container, entryId, modelId]);

            if (!scheduled) {
                return <Original {...props} />;
            }

            const goLiveOn = scheduled.publishOn || scheduled.unpublishOn;
            const actionLabel =
                scheduled.actionType === ScheduleActionType.unpublish ? "unpublish" : "publish";

            return (
                <>
                    <Alert type={"warning"} variant={"subtle"} className={"mb-md"}>
                        This entry has a {actionLabel} scheduled
                        {goLiveOn ? ` for ${formatScheduledDate(goLiveOn)}` : ""}. Publishing now
                        will cancel it.
                    </Alert>
                    <Original {...props} />
                </>
            );
        };
    }
);
