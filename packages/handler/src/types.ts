import type { Container } from "@webiny/di";
import type { PluginsContainer } from "@webiny/plugins";

export interface Request {
    headers: Record<string, string | undefined>;
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, string | string[]>;
    path?: string;
    [key: string]: unknown;
}

export interface Reply {
    send(data?: unknown): void | Promise<void>;
    code(statusCode: number): Reply;
    headers(headers: Record<string, string>): Reply;
    [key: string]: unknown;
}

export interface Context {
    plugins: PluginsContainer;
    container: Container;
}
