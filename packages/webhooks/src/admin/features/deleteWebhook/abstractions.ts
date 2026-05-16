import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteWebhookGateway {
    execute(id: string): Promise<boolean>;
}

export const DeleteWebhookGateway = createAbstraction<IDeleteWebhookGateway>("DeleteWebhookGateway");

export namespace DeleteWebhookGateway {
    export type Interface = IDeleteWebhookGateway;
}

export interface IDeleteWebhookUseCase {
    execute(id: string): Promise<boolean>;
}

export const DeleteWebhookUseCase = createAbstraction<IDeleteWebhookUseCase>("DeleteWebhookUseCase");

export namespace DeleteWebhookUseCase {
    export type Interface = IDeleteWebhookUseCase;
}
