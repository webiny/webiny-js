import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WebhookDelivery, WebhookDeliveryStatus } from "~/api/domain/WebhookDelivery.js";
import type {
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError,
    WebhookPersistenceError,
    WebhookValidationError
} from "~/api/domain/errors.js";
import type {
    DateStringInterfaceGenerator,
    IdInterfaceGenerator,
    NumericInterfaceGenerator,
    TextInterfaceGenerator
} from "@webiny/api";

export interface IListWebhookDeliveriesInputWhere
    extends
        IdInterfaceGenerator<"id">,
        IdInterfaceGenerator<"webhookId">,
        IdInterfaceGenerator<"backgroundTaskId">,
        DateStringInterfaceGenerator<"createdOn">,
        DateStringInterfaceGenerator<"savedOn">,
        TextInterfaceGenerator<"eventType">,
        TextInterfaceGenerator<WebhookDeliveryStatus>,
        NumericInterfaceGenerator<"responseStatus"> {
    //
}

export interface IListWebhookDeliveriesInput {
    where?: IListWebhookDeliveriesInputWhere;
    limit?: number;
    after?: string;
    sort?: (`${string}_ASC` | `${string}_DESC`)[];
}

export interface IListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

type IError =
    | WebhookPersistenceError
    | WebhookModelNotFoundError
    | WebhookNotAuthorizedError
    | WebhookValidationError;

export interface IListWebhookDeliveriesOutput {
    items: WebhookDelivery[];
    meta: IListMeta;
}

export interface IListWebhookDeliveriesUseCase {
    execute(
        input: IListWebhookDeliveriesInput
    ): Promise<Result<IListWebhookDeliveriesOutput, IError>>;
}

export const ListWebhookDeliveriesUseCase = createAbstraction<IListWebhookDeliveriesUseCase>(
    "Webhooks/ListWebhookDeliveriesUseCase"
);

export namespace ListWebhookDeliveriesUseCase {
    export type Interface = IListWebhookDeliveriesUseCase;
    export type Output = IListWebhookDeliveriesOutput;
    export type Error = IError;
}

export interface IListWebhookDeliveriesRepository {
    execute(
        input: IListWebhookDeliveriesInput
    ): Promise<Result<IListWebhookDeliveriesOutput, IError>>;
}

export const ListWebhookDeliveriesRepository = createAbstraction<IListWebhookDeliveriesRepository>(
    "Webhooks/ListWebhookDeliveriesRepository"
);

export namespace ListWebhookDeliveriesRepository {
    export type Interface = IListWebhookDeliveriesRepository;
    export type Error = IError;
}
