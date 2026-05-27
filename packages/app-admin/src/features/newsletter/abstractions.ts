import { createAbstraction } from "@webiny/feature/admin";

export interface INewsletterSubscriptionService {
    subscribe(params: { email: string; firstName: string; lastName: string }): Promise<void>;
}

export const NewsletterSubscriptionService = createAbstraction<INewsletterSubscriptionService>(
    "NewsletterSubscriptionService"
);

export namespace NewsletterSubscriptionService {
    export type Interface = INewsletterSubscriptionService;
}
