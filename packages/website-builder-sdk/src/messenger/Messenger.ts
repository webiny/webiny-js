import { isMatch } from "matcher";
import type { MessageOrigin } from "./MessageOrigin.js";
import { logger } from "../Logger.js";

export type Message<T = any> = {
    type: string;
    payload: T;
};

type Handler<T = any> = (payload: T, logicalType: string, wildcardMatch?: string) => void;

const ignored = [
    "preview.mouse.move",
    "preview.component.register",
    "preview.scroll",
    "preview.viewport",
    "preview.viewport.change.start",
    "preview.viewport.change.end"
];

export class Messenger {
    private listeners = new Map<string, Set<Handler>>();
    private readonly pattern: string;
    private readonly prefixGlob: string;

    constructor(
        private source: MessageOrigin,
        private target: MessageOrigin,
        // Pattern to filter events this Messenger handles.
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

        if (!type || !isMatch(type, this.pattern)) {
            return;
        }

        const logicalType = this.stripPrefix(type);

        if (!this.isIgnored(logicalType)) {
            logger.debug(
                {
                    type,
                    payload
                },
                `${this.getTime()} --> [${this.source.origin}][${logicalType}]`
            );
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
            logger.debug(
                {
                    type: fullType,
                    payload
                },
                `${this.getTime()} <-- [${this.source.origin}][${logicalType}]`
            );
        }

        this.target.window.postMessage({ type: fullType, payload }, this.target.origin);
    }

    dispose() {
        this.source.window.removeEventListener("message", this.handleMessage);
        this.listeners.clear();
    }

    getTime() {
        const date = new Date();
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
    }
}
