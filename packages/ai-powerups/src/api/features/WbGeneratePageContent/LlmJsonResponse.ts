export class LlmJsonResponse {
    private constructor(private readonly text: string) {}

    static fromRawText(raw: string): LlmJsonResponse {
        const stripped = raw
            .replace(/^```(?:json)?\s*\n?/, "")
            .replace(/\n?```\s*$/, "")
            .trim();

        return new LlmJsonResponse(stripped);
    }

    toArray(): unknown[] {
        const parsed = JSON.parse(this.text);

        if (Array.isArray(parsed)) {
            return parsed;
        }

        if (parsed && typeof parsed === "object") {
            const firstKey = Object.keys(parsed)[0];
            if (firstKey && Array.isArray(parsed[firstKey])) {
                return parsed[firstKey];
            }
        }

        return [parsed];
    }

    toString(): string {
        return JSON.stringify(this.toArray());
    }
}
