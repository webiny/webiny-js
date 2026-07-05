import type { MessageOrigin } from "./MessageOrigin.js";

export type Message<T = any> = {
    type: string;
    payload: T;
};

type Handler<T = any> = (payload: T, logicalType: string) => void;

const ignored: string[] = [];

export class Messenger {
    private listeners = new Map<string, Set<Handler>>();
    private readonly pattern: string;
    private readonly prefixGlob: string;

    constructor(
        private source: MessageOrigin,
        private target: MessageOrigin,
        pattern: string
    ) {
        this.pattern = pattern;
        this.prefixGlob = pattern.replace(/\*+$/, "");
        this.handleMessage = this.handleMessage.bind(this);
        this.source.window.addEventListener("message", this.handleMessage);
    }

    private handleMessage(event: MessageEvent) {
        const { type, payload } = event.data || {};
        if (!this.target.matches(event)) {
            return;
        }

        if (!type || !type.startsWith(this.prefixGlob)) {
            return;
        }

        const logicalType = this.stripPrefix(type);

        if (!this.isIgnored(logicalType)) {
            console.debug(`${this.getTime()} --> [${this.source.origin}][${logicalType}]`, payload);
        }

        const handlers = this.listeners.get(logicalType);
        if (handlers) {
            handlers.forEach(fn => fn(payload, logicalType));
        }
    }

    private stripPrefix(fullType: string): string {
        return fullType.startsWith(this.prefixGlob)
            ? fullType.slice(this.prefixGlob.length)
            : fullType;
    }

    private isIgnored(logicalType: string): boolean {
        return ignored.includes(logicalType);
    }

    on<T = any>(logicalType: string, handler: Handler<T>) {
        if (!this.listeners.has(logicalType)) {
            this.listeners.set(logicalType, new Set());
        }
        this.listeners.get(logicalType)!.add(handler);
        return () => {
            const listeners = this.listeners.get(logicalType);
            if (listeners) {
                listeners.delete(handler);
            }
        };
    }

    send<T = any>(logicalType: string, payload?: T) {
        const fullType = this.prefixGlob + logicalType;

        if (!this.isIgnored(logicalType)) {
            console.debug(`${this.getTime()} <-- [${this.source.origin}][${logicalType}]`, payload);
        }

        this.target.window.postMessage({ type: fullType, payload }, this.target.origin);
    }

    dispose() {
        this.source.window.removeEventListener("message", this.handleMessage);
        this.listeners.clear();
    }

    private getTime() {
        const date = new Date();
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
    }
}
