import React from "react";
import { Accordion, Tag, Text, TimeAgo } from "@webiny/admin-ui";
import { ReactComponent as ReplayIcon } from "@webiny/icons/replay.svg";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { DeliveryDetailContent } from "./DeliveryDetailContent.js";
import { statusVariant } from "./statusVariant.js";

interface DeliveryAccordionRowProps {
    delivery: WebhookDelivery;
    open: boolean;
    resending: boolean;
    onOpenChange: (open: boolean) => void;
    onResend: (id: string) => void;
}

export const DeliveryAccordionRow = ({
    delivery,
    open,
    resending,
    onOpenChange,
    onResend
}: DeliveryAccordionRowProps) => {
    return (
        <Accordion.Item
            open={open}
            onOpenChange={onOpenChange}
            title={delivery.eventType}
            description={
                <div className="flex items-center gap-sm">
                    <Tag variant={statusVariant(delivery.status)} content={delivery.status} />
                    {delivery.responseStatus !== null && (
                        <Text size="sm">HTTP {delivery.responseStatus}</Text>
                    )}
                    {delivery.responseTime !== null && (
                        <Text size="sm">{delivery.responseTime}ms</Text>
                    )}

                    <Text size="sm" className="text-neutral-strong">
                        <TimeAgo datetime={delivery.createdOn} />
                    </Text>
                </div>
            }
            actions={
                <Accordion.Item.Action
                    icon={<ReplayIcon />}
                    onClick={() => onResend(delivery.id)}
                    aria-label="Resend delivery"
                    disabled={resending}
                />
            }
        >
            <DeliveryDetailContent delivery={delivery} />
        </Accordion.Item>
    );
};
