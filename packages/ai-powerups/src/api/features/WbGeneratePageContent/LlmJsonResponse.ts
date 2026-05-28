export class LlmJsonResponse {
    private constructor(private readonly text: string) {}

    static fromRawText(raw: string): LlmJsonResponse {
        let text = raw
            .replace(/^```(?:json)?\s*\n?/, "")
            .replace(/\n?```\s*$/, "")
            .trim();

        // Models that use tool calls sometimes emit a brief preamble before
        // the JSON ("Now I have the images, here's the page:") and/or trailing
        // prose after. Slice to the first `[`/`{` and the matching last
        // `]`/`}` so JSON.parse sees only the structured block.
        const startIdx = text.search(/[\[{]/);
        if (startIdx > 0) {
            text = text.slice(startIdx);
        }
        if (text.startsWith("[")) {
            const endIdx = text.lastIndexOf("]");
            if (endIdx >= 0) {
                text = text.slice(0, endIdx + 1);
            }
        } else if (text.startsWith("{")) {
            const endIdx = text.lastIndexOf("}");
            if (endIdx >= 0) {
                text = text.slice(0, endIdx + 1);
            }
        }

        return new LlmJsonResponse(text);
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
