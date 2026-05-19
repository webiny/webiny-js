import { createAbstraction } from "@webiny/feature/admin";

export interface IResendWebhookDeliveryGateway {
    execute(id: string): Promise<boolean>;
}

export const ResendWebhookDeliveryGateway = createAbstraction<IResendWebhookDeliveryGateway>(
    "ResendWebhookDeliveryGateway"
);

export namespace ResendWebhookDeliveryGateway {
    export type Interface = IResendWebhookDeliveryGateway;
}

export interface IResendWebhookDeliveryUseCase {
    execute(id: string): Promise<boolean>;
}

export const ResendWebhookDeliveryUseCase = createAbstraction<IResendWebhookDeliveryUseCase>(
    "ResendWebhookDeliveryUseCase"
);

export namespace ResendWebhookDeliveryUseCase {
    export type Interface = IResendWebhookDeliveryUseCase;
}
