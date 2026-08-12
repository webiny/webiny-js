/**
 * Extract a JSON object from a model's text response — tolerant of a ```json fence and of prose before
 * or after the object. Returns null if nothing parseable is found; the caller decides what that means.
 */
export const extractJson = <T>(text: string): T | null => {
    const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
    const candidate = fenced ? fenced[1] : text;

    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
        return null;
    }

    try {
        return JSON.parse(candidate.slice(start, end + 1)) as T;
    } catch {
        return null;
    }
};
