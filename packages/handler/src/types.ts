import type { Container } from "@webiny/feature/api";
import type { PluginsContainer } from "@webiny/plugins";

export interface Request {
    url?: string;
    method?: string;
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
    header(name: string, value: string): Reply;
    setCookie(name: string, value: string, options?: Record<string, unknown>): Reply;
    [key: string]: unknown;
}

export interface Context {
    plugins: PluginsContainer;
    container: Container;
}
