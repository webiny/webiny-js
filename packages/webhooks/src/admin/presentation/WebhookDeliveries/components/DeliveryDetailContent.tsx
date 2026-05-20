import React from "react";
import { Accordion, Separator, Tag, Text, TimeAgo } from "@webiny/admin-ui";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { statusVariant } from "./statusVariant.js";

interface DeliveryDetailContentProps {
    delivery: WebhookDelivery;
}

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

export const DeliveryDetailContent = ({ delivery }: DeliveryDetailContentProps) => {
    return (
        <div className="flex flex-col gap-md">
            <div className="flex items-center gap-sm flex-wrap">
                <Tag variant={statusVariant(delivery.status)} content={delivery.status} />
                {delivery.responseStatus !== null && (
                    <Text size="sm">HTTP {delivery.responseStatus}</Text>
                )}
                {delivery.responseTime !== null && <Text size="sm">{delivery.responseTime}ms</Text>}
                {delivery.createdOn && (
                    <Text size="sm" className="text-neutral-strong">
                        <TimeAgo datetime={delivery.createdOn} />
                    </Text>
                )}
            </div>
            <Separator />
            <Accordion variant="underline">
                <Accordion.Item title="Payload" defaultOpen={true}>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[250px]">
                        {formatJson(delivery.payload)}
                    </pre>
                </Accordion.Item>
                <Accordion.Item title="Request Headers" defaultOpen={false}>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {formatJson(delivery.requestHeaders)}
                    </pre>
                </Accordion.Item>
                <Accordion.Item title="Response Headers" defaultOpen={false}>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {formatJson(delivery.responseHeaders)}
                    </pre>
                </Accordion.Item>
                <Accordion.Item title="Response Body" defaultOpen={false}>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {delivery.responseBody ?? "—"}
                    </pre>
                </Accordion.Item>
            </Accordion>
        </div>
    );
};
