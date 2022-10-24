import { SecurityPermission } from "@webiny/app-security/types";

/**
 * A base security permission for APW.
 *
 * @category SecurityPermission
 */
export interface MailerSecurityPermission extends SecurityPermission {
    changeSettings?: boolean;
}

/**
 * GraphQL API call response for the transport settings values
 * @category GraphQL
 */
export interface TransportSettings {
    host: string;
    user: string;
    from: string;
    replyTo?: string;
    password?: string;
}
/**
 *
 * @category GraphQL
 */
export interface ApiError<T = Record<string, any>> {
    message: string;
    code: string;
    data: T;
}
