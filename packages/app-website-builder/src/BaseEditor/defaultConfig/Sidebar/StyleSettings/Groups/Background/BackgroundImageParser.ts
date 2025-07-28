type ParsedUrl = { url: string };
type ParsedImageSet = { images: { url: string; scale: string }[] };

type BackgroundImageRule =
    | {
          type: "url";
          raw: string;
          parsed: ParsedUrl;
      }
    | {
          type: "image-set";
          raw: string;
          parsed: ParsedImageSet;
      }
    | {
          type: "linear-gradient" | "radial-gradient" | "conic-gradient";
          raw: string;
      }
    | {
          type: "unknown";
          raw: string;
      };

export class BackgroundImageParser {
    private readonly rules: BackgroundImageRule[] = [];

    constructor(private input: string) {
        this.rules = this.parseInternal();
    }

    public getRules(): BackgroundImageRule[] {
        return [...this.rules];
    }

    public getCssValue(): string {
        return this.rules
            .map(rule => {
                switch (rule.type) {
                    case "url":
                        return `url("${rule.parsed.url}")`;
                    case "image-set":
                        const entries = rule.parsed.images
                            .map(img => `url("${img.url}") ${img.scale}`)
                            .join(", ");
                        return `image-set(${entries})`;
                    case "linear-gradient":
                    case "radial-gradient":
                    case "conic-gradient":
                    case "unknown":
                        return rule.raw;
                }
            })
            .join(", ");
    }

    private parseInternal(): BackgroundImageRule[] {
        if (!this.input || this.input.trim() === "none") {
            return [];
        }

        const rules: BackgroundImageRule[] = [];
        const parts = this.splitTopLevelCommaSeparated(this.input);

        for (const part of parts) {
            const raw = part.trim();

            // url(...)
            const urlMatch = raw.match(/^url\((['"]?)(.*?)\1\)$/i);
            if (urlMatch) {
                rules.push({
                    type: "url",
                    raw,
                    parsed: { url: urlMatch[2] }
                });
                continue;
            }

            // gradients (not parsed deeply)
            const gradientMatch = raw.match(/^(linear|radial|conic)-gradient\(.+\)$/i);
            if (gradientMatch) {
                rules.push({
                    type: gradientMatch[1].toLowerCase() as
                        | "linear-gradient"
                        | "radial-gradient"
                        | "conic-gradient",
                    raw
                });
                continue;
            }

            // image-set(...)
            const imageSetMatch = raw.match(/^image-set\s*\((.*)\)$/i);
            if (imageSetMatch) {
                const entries = imageSetMatch[1]
                    .split(/,(?![^(]*\))/)
                    .map(entry => {
                        const match = entry.match(/url\((['"]?)(.*?)\1\)\s*(\d+x|\d+\.?\d*dpi)/);
                        return match ? { url: match[2], scale: match[3] } : null;
                    })
                    .filter(Boolean) as { url: string; scale: string }[];

                rules.push({
                    type: "image-set",
                    raw,
                    parsed: { images: entries }
                });
                continue;
            }

            rules.push({
                type: "unknown",
                raw
            });
        }

        return rules;
    }

    private splitTopLevelCommaSeparated(input: string): string[] {
        const parts: string[] = [];
        let depth = 0;
        let current = "";

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            if (char === "," && depth === 0) {
                parts.push(current.trim());
                current = "";
            } else {
                if (char === "(") {
                    depth++;
                }
                if (char === ")") {
                    depth--;
                }
                current += char;
            }
        }

        if (current) {
            parts.push(current.trim());
        }

        return parts;
    }
}
