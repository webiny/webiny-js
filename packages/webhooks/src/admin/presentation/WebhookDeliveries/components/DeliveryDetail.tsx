import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { DeliveryDetailContent } from "./DeliveryDetailContent.js";

interface DeliveryDetailProps {
    delivery: WebhookDelivery;
    onClose: () => void;
    onResend: (id: string) => void;
}

export const DeliveryDetail = observer(function DeliveryDetail({
    delivery,
    onClose,
    onResend
}: DeliveryDetailProps) {
    return (
        <div className="flex flex-col h-full overflow-auto">
            <div className="flex items-center justify-between px-md py-sm">
                <Heading level={6}>{delivery.eventType}</Heading>
                <IconButton
                    icon={<CloseIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label="Close detail"
                />
            </div>
            <Separator />
            <div className="flex-1 overflow-auto px-md py-sm">
                <DeliveryDetailContent delivery={delivery} />
            </div>
            <Separator />
            <div className="px-md py-sm">
                <Button variant="secondary" onClick={() => onResend(delivery.id)}>
                    Resend
                </Button>
            </div>
        </div>
    );
});
