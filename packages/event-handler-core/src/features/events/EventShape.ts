function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

/**
 * What an incoming event looks like, safe to put in an error message: its top-level keys and the two
 * EventBridge discriminators (`source`, `detail-type`), never the values of the other keys. For a
 * value that isn't an object, only its `typeof`.
 */
export class EventShape {
    private constructor(private readonly summary: Record<string, unknown>) {}

    static from(event: unknown): EventShape {
        if (!isRecord(event)) {
            return new EventShape({ type: typeof event });
        }

        return new EventShape({
            keys: Object.keys(event),
            source: event.source,
            detailType: event["detail-type"]
        });
    }

    toString(): string {
        return JSON.stringify(this.summary);
    }
}
