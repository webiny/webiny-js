import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";

export interface SentTransportMessage {
    users: NotificationTransport.User[];
    message: NotificationTransport.Message;
}

/**
 * A custom transport that records what it is asked to send. `order` is an optional shared list a
 * test passes to several transports to see the order they were called in. With `mode: "throw"` it
 * throws (a broken third-party transport). Register with
 * `container.registerInstance(NotificationTransport, transport)`; use an id other than
 * `"e-mail"`, which the built-in transport owns.
 */
export class RecordingNotificationTransport implements NotificationTransport.Interface {
    public readonly title: string;
    public readonly sent: SentTransportMessage[] = [];
    public mode: "ok" | "throw" = "ok";
    public failureMessage = "The transport failed.";

    public constructor(
        public readonly id: string,
        private readonly order: string[] = []
    ) {
        this.title = id;
    }

    public async send(params: NotificationTransport.SendParams): Promise<void> {
        this.order.push(this.id);
        this.sent.push({ users: structuredClone(params.users), message: { ...params.message } });
        if (this.mode === "throw") {
            throw Object.assign(new Error(this.failureMessage), { code: "TRANSPORT_FAILED" });
        }
    }
}
