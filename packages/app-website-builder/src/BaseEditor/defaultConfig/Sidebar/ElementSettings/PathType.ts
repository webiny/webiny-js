const scalars = ["string", "number", "boolean"];

export class PathType {
    private readonly nativeType: string;

    constructor(nativeType: string) {
        this.nativeType = nativeType;
    }

    public toString(): string {
        return this.nativeType;
    }

    public matches(expected: string): boolean {
        const map: Record<string, string[]> = {
            text: ["string"],
            longText: ["string"],
            number: ["number"],
            boolean: ["boolean"],
            array: ["array"],
            object: ["object"],
            json: ["object"]
        };

        const allowed = map[expected] || [];
        return allowed.includes(this.nativeType);
    }

    isArray() {
        return this.nativeType === "array";
    }

    isScalar() {
        return scalars.includes(this.nativeType);
    }
}
