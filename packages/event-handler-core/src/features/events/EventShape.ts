const MAX_DISCRIMINATOR_LENGTH = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

/*
 * A discriminator is printed only when it is a string, and cut to a fixed length, so an event that
 * puts arbitrary input under `source` or `detail-type` can't push it into a log in full.
 */
function describeDiscriminator(value: unknown): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }
    return value.slice(0, MAX_DISCRIMINATOR_LENGTH);
}

/**
 * What an incoming event looks like, safe to put in an error message: its top-level keys and the two
 * EventBridge discriminators (`source`, `detail-type`, strings only, cut to 100 characters), never the
 * values of the other keys. For a value that isn't an object, only its `typeof`.
 */
export class EventShape {
    private constructor(private readonly summary: Record<string, unknown>) {}

    static from(event: unknown): EventShape {
        if (!isRecord(event)) {
            return new EventShape({ type: typeof event });
        }

        return new EventShape({
            keys: Object.keys(event),
            source: describeDiscriminator(event.source),
            detailType: describeDiscriminator(event["detail-type"])
        });
    }

    toString(): string {
        return JSON.stringify(this.summary);
    }
}
