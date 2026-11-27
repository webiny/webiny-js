import { createAbstraction } from "@webiny/feature/admin";
import type { MailerSettings } from "~/admin/types.js";
import type { TransportSettings } from "~/admin/types.js";

export interface ISaveSettingsGateway {
    execute(data: TransportSettings): Promise<MailerSettings>;
}

export const SaveSettingsGateway = createAbstraction<ISaveSettingsGateway>(
    "Mailer/SaveSettingsGateway"
);

export namespace SaveSettingsGateway {
    export type Interface = ISaveSettingsGateway;
}

export interface ISaveSettingsUseCase {
    execute(data: TransportSettings): Promise<MailerSettings>;
}

export const SaveSettingsUseCase = createAbstraction<ISaveSettingsUseCase>(
    "Mailer/SaveSettingsUseCase"
);

export namespace SaveSettingsUseCase {
    export type Interface = ISaveSettingsUseCase;
}
