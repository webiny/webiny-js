import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import type { WebhookDelivery } from "~/admin/shared/types.js";

interface DeliveryDetailProps {
    delivery: WebhookDelivery;
    onClose: () => void;
    onResend: (id: string) => void;
}

const statusVariant = (status: string) => {
    switch (status) {
        case "delivered":
            return "success" as const;
        case "failed":
            return "destructive" as const;
        default:
            return "warning" as const;
    }
};

const formatJson = (value: unknown): string => {
    if (value === null || value === undefined) {
        return "—";
    }

    if (typeof value === "string") {
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }

    return JSON.stringify(value, null, 2);
};

export const DeliveryDetail = observer(function DeliveryDetail({
    delivery,
    onClose,
    onResend
}: DeliveryDetailProps) {
    return (
        <div className="flex flex-col h-full overflow-auto">
            <div className="flex items-center justify-between px-md py-sm">
                <div className="flex items-center gap-sm">
                    <Heading level={6}>{delivery.eventType}</Heading>
                    <Tag variant={statusVariant(delivery.status)} content={delivery.status} />
                </div>
                <IconButton
                    icon={<CloseIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label="Close detail"
                />
            </div>
            <Separator />
            <div className="flex-1 overflow-auto px-md py-sm flex flex-col gap-md">
                <div>
                    <Text size="sm" className="text-neutral-strong">
                        Response Time
                    </Text>
                    <Text size="sm">
                        {delivery.responseTime !== null ? `${delivery.responseTime}ms` : "—"}
                    </Text>
                </div>

                <div>
                    <Text size="sm" className="text-neutral-strong">
                        Payload
                    </Text>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {formatJson(delivery.payload)}
                    </pre>
                </div>

                <div>
                    <Text size="sm" className="text-neutral-strong">
                        Request Headers
                    </Text>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {formatJson(delivery.requestHeaders)}
                    </pre>
                </div>

                <div>
                    <Text size="sm" className="text-neutral-strong">
                        Response Body
                    </Text>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {delivery.responseBody ?? "—"}
                    </pre>
                </div>
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
