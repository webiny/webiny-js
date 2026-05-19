import { z } from "zod";

const id = z.string().min(1, "id is required");

export const getWebhookSchema = z.object({
    id
});

export const listWebhooksSchema = z.object({
    where: z
        .object({
            enabled: z.boolean().optional()
        })
        .optional(),
    limit: z.number().int().positive().optional(),
    after: z.string().optional()
});

export const createWebhookSchema = z.object({
    name: z.string().min(1, "name is required"),
    endpointUrl: z.string().url("endpointUrl must be a valid URL"),
    events: z.array(z.string().min(1)).min(1, "events must contain at least one entry"),
    slug: z.string().optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional()
});

export const updateWebhookSchema = z.object({
    id,
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    endpointUrl: z.string().url("endpointUrl must be a valid URL").optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    events: z.array(z.string().min(1)).optional()
});

export const deleteWebhookSchema = z.object({
    id
});

export const getWebhookDeliverySchema = z.object({
    id
});

export const listWebhookDeliveriesSchema = z.object({
    webhookId: z.string().min(1, "webhookId is required"),
    limit: z.number().int().positive().optional(),
    after: z.string().optional()
});

export const resendWebhookDeliverySchema = z.object({
    id
});

export const triggerWebhookSchema = z.object({
    id,
    payload: z.record(z.string(), z.unknown())
});
