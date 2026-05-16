import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";

export interface CreateWebhookInput {
    name: string;
    endpointUrl: string;
    events: string[];
    slug?: string;
    description?: string;
    enabled?: boolean;
}

export interface ICreateWebhookGateway {
    execute(input: CreateWebhookInput): Promise<Webhook>;
}

export const CreateWebhookGateway =
    createAbstraction<ICreateWebhookGateway>("CreateWebhookGateway");

export namespace CreateWebhookGateway {
    export type Interface = ICreateWebhookGateway;
}

export interface ICreateWebhookUseCase {
    execute(input: CreateWebhookInput): Promise<Webhook>;
}

export const CreateWebhookUseCase =
    createAbstraction<ICreateWebhookUseCase>("CreateWebhookUseCase");

export namespace CreateWebhookUseCase {
    export type Interface = ICreateWebhookUseCase;
}
