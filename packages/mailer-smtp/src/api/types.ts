export interface TransportSettings {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
    replyTo?: string;
}
