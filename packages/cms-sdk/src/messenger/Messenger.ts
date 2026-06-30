import type { MessageOrigin } from "./MessageOrigin.js";

type Handler<T = any> = (payload: T) => void;

export class Messenger {
    private listeners = new Map<string, Set<Handler>>();
    private readonly prefix: string;
    private readonly pattern: string;

    constructor(
        private source: MessageOrigin,
        private target: MessageOrigin,
        pattern: string
    ) {
        this.pattern = pattern;
        this.prefix = pattern.replace(/\*+$/, "");
        this.handleMessage = this.handleMessage.bind(this);
        this.source.window.addEventListener("message", this.handleMessage);
    }

    private handleMessage(event: MessageEvent) {
        const { type, payload } = event.data || {};
        if (!this.target.matches(event)) {
            return;
        }

        if (!type || !type.startsWith(this.prefix)) {
            return;
        }

        const logicalType = type.slice(this.prefix.length);
        const handlers = this.listeners.get(logicalType);
        if (handlers) {
            handlers.forEach(fn => fn(payload));
        }
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
        const fullType = this.prefix + logicalType;
        this.target.window.postMessage({ type: fullType, payload }, this.target.origin);
    }

    dispose() {
        this.source.window.removeEventListener("message", this.handleMessage);
        this.listeners.clear();
    }
}
