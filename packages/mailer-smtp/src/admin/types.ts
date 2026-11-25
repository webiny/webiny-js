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
