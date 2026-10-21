/**
 * The fixed id of a global component's instance element, e.g. `$global:Demo/Header`.
 * Mirrors `GlobalElementId` in `@webiny/website-builder-sdk`; keep the two in step.
 */
export class GlobalElementId {
    static readonly PREFIX = "$global:";

    private readonly id: string;

    private constructor(id: string) {
        this.id = id;
    }

    static fromName(name: string): GlobalElementId {
        return new GlobalElementId(`${GlobalElementId.PREFIX}${name}`);
    }

    // From an element id: `null` when it isn't the id of a global's instance element.
    static fromId(id: unknown): GlobalElementId | null {
        return GlobalElementId.isGlobal(id) ? new GlobalElementId(id) : null;
    }

    static isGlobal(id: unknown): id is string {
        return typeof id === "string" && id.startsWith(GlobalElementId.PREFIX);
    }

    // The name of the global component this id stands for.
    get name(): string {
        return this.id.slice(GlobalElementId.PREFIX.length);
    }

    equals(other: GlobalElementId | null | undefined): boolean {
        return !!other && other.id === this.id;
    }

    toString(): string {
        return this.id;
    }
}
