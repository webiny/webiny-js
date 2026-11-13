import { createAbstraction } from "@webiny/feature/admin";

export interface ISendTestMailGateway {
    execute(to: string): Promise<void>;
}

export const SendTestMailGateway = createAbstraction<ISendTestMailGateway>(
    "Mailer/SendTestMailGateway"
);

export namespace SendTestMailGateway {
    export type Interface = ISendTestMailGateway;
}

export interface ISendTestMailUseCase {
    execute(to: string): Promise<void>;
}

export const SendTestMailUseCase = createAbstraction<ISendTestMailUseCase>(
    "Mailer/SendTestMailUseCase"
);

export namespace SendTestMailUseCase {
    export type Interface = ISendTestMailUseCase;
}
