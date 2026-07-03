import { Identity } from "@webiny/app-admin/domain/Identity.js";

export interface MailerSecurityPermission extends Identity.Permission {
    changeSettings?: boolean;
}

export type MailerSettingsSource = "code" | "storage" | null;

export interface MailerSettings {
    host: string;
    port?: number;
    user: string;
    from: string;
    replyTo?: string;
    source?: MailerSettingsSource;
}

export interface TransportSettings {
    host: string;
    port?: number;
    user: string;
    from: string;
    replyTo?: string;
    password?: string;
}
