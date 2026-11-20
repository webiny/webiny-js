type Elements = Record<string, any>;

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

    /**
     * The global an element belongs to: the global itself, or the global it sits inside, found through the
     * element's parent chain. An id without an element (e.g. of a binding) belongs to a global only when it
     * is that global's id.
     */
    static rootOf(elements: Elements, id: string): GlobalElementId | null {
        const visited = new Set<string>();
        let currentId: string | undefined = id;

        while (currentId && !visited.has(currentId)) {
            const globalId = GlobalElementId.fromId(currentId);
            if (globalId) {
                return globalId;
            }

            visited.add(currentId);
            currentId = elements[currentId]?.parent?.id;
        }

        return null;
    }

    // The name of the global component this id stands for.
    get name(): string {
        return this.id.slice(GlobalElementId.PREFIX.length);
    }

    equals(other: GlobalElementId | null | undefined): boolean {
        return !!other && other.id === this.id;
    }

    // Whether an element (or binding) is this global, or sits inside it.
    owns(elements: Elements, id: string): boolean {
        return this.equals(GlobalElementId.rootOf(elements, id));
    }

    toString(): string {
        return this.id;
    }
}
