import React from "react";
import { Separator, Tabs } from "@webiny/admin-ui";
import type { WebhookDelivery } from "~/admin/shared/types.js";

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

const getContentType = (responseHeaders: unknown): string | null => {
    if (!responseHeaders || typeof responseHeaders !== "object") {
        return null;
    }
    const headers = responseHeaders as Record<string, string>;
    const key = Object.keys(headers).find(k => k.toLowerCase() === "content-type");
    if (!key) {
        return null;
    }
    return headers[key].split(";")[0].trim().toLowerCase();
};

const getContentTypeLabel = (contentType: string | null): string | null => {
    if (!contentType) {
        return null;
    }
    if (contentType.includes("json")) {
        return "JSON";
    }
    if (contentType.includes("html")) {
        return "HTML";
    }
    if (contentType.includes("xml")) {
        return "XML";
    }
    if (contentType.includes("plain")) {
        return "TEXT";
    }
    return null;
};

const renderResponseBody = (body: string | null, contentType: string | null): string => {
    if (body === null) {
        return "—";
    }
    if (!contentType || contentType.includes("json")) {
        return formatJson(body);
    }
    return body;
};

export const DeliveryDetailContent = ({ delivery }: DeliveryDetailContentProps) => {
    const contentType = getContentType(delivery.responseHeaders);
    const contentTypeLabel = getContentTypeLabel(contentType);

    return (
        <div className="flex flex-col gap-md">
            <Separator />
            <Tabs
                tabs={[
                    <Tabs.Tab
                        key="payload"
                        value="payload"
                        trigger="Payload"
                        content={
                            <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[250px]">
                                {formatJson(delivery.payload)}
                            </pre>
                        }
                    />,
                    <Tabs.Tab
                        key="req-headers"
                        value="req-headers"
                        trigger="Request Headers"
                        content={
                            <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                                {formatJson(delivery.requestHeaders)}
                            </pre>
                        }
                    />,
                    <Tabs.Tab
                        key="resp-headers"
                        value="resp-headers"
                        trigger="Response Headers"
                        content={
                            <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                                {formatJson(delivery.responseHeaders)}
                            </pre>
                        }
                    />,
                    <Tabs.Tab
                        key="resp-body"
                        value="resp-body"
                        trigger={
                            contentTypeLabel
                                ? `Response Body (${contentTypeLabel})`
                                : "Response Body"
                        }
                        content={
                            <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                                {renderResponseBody(delivery.responseBody, contentType)}
                            </pre>
                        }
                    />
                ]}
            />
        </div>
    );
};
