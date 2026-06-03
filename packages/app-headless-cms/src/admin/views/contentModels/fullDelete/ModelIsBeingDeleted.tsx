import React, { useCallback, useState } from "react";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { useNamedConfirmationDialog } from "@webiny/app-admin";
import { useCancelDelete } from "~/admin/views/contentModels/fullDelete/useCancelDelete.js";
import { Button, Text } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/views/content-models/fully-delete-model");

export interface IModelOverlayProps {
    model: CmsModel;
}

const CancelDelete = ({ model }: IModelOverlayProps) => {
    const { cancel } = useCancelDelete({ model });
    const { showConfirmation } = useNamedConfirmationDialog({
        title: "Stop the model and entries delete process?",
        message: "Are you sure you want to stop the model and entries delete process?",
        acceptLabel: "Yes, I am sure.",
        cancelLabel: "No, keep deleting."
    });

    const onClick = useCallback(() => {
        showConfirmation(async () => {
            await cancel();
        });
    }, [showConfirmation, model.modelId]);

    return <Button text={t`Cancel delete`} size={"sm"} onClick={onClick} />;
};

export const ModelIsBeingDeleted = ({
    model,
    children
}: React.PropsWithChildren<IModelOverlayProps>) => {
    const [over, setOver] = useState(false);

    const onMouseEnter = useCallback(() => {
        setOver(true);
    }, [setOver]);

    const onMouseLeave = useCallback(() => {
        setOver(false);
    }, [setOver]);

    if (!model.isBeingDeleted) {
        return <>{children}</>;
    }

    const message = model.plugin ? "Records are being deleted." : "Model is being deleted.";
    return (
        <div
            style={{ width: "150px" }}
            className={"text-right"}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {!over && (
                <Text size={"sm"} as={"div"} className={"text-destructive-primary"}>
                    {message}
                </Text>
            )}
            {over && <CancelDelete model={model} />}
        </div>
    );
};
