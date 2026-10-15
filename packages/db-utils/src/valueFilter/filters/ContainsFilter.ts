import { ValueFilter } from "../abstractions/ValueFilter.js";

const createValues = (initialValue: string | string[] | object): string[] => {
    if (typeof initialValue === "string") {
        return [initialValue];
    }

    if (Array.isArray(initialValue)) {
        return initialValue
            .flatMap(v => {
                /**
                 * Arrays can contain objects (e.g. searchable-json values in a multiple values object field)
                 * and other arrays, at any depth, so we go through their values instead of converting them
                 * to a string.
                 */
                if (v !== null && typeof v === "object") {
                    return createValues(v);
                }
                return v.toString();
            })
            .filter(Boolean);
    }

    const result: string[] = [];

    const traverse = (node: any): void => {
        if (node == null) {
            return;
        }
        if (typeof node === "string" || typeof node === "number") {
            result.push(node.toString());
        } else if (Array.isArray(node)) {
            node.forEach(traverse);
        } else if (typeof node === "object") {
            Object.values(node).forEach(traverse);
        }
    };

    traverse(initialValue);

    return result.filter(Boolean);
};

const escapeRegex = (value: string): string => {
    return value.replace(/[\\^$.*+?()[\]{}|/]/g, "\\$&");
};

const createCompareValues = (value: string) => {
    return value
        .replace(/\s+/g, " ")
        .trim()
        .replace(/:/g, "")
        .split(" ")
        .filter(val => {
            return val.length > 0;
        })
        .map(escapeRegex);
};

class ContainsFilterImpl implements ValueFilter.Interface {
    public readonly operation = "contains";

    public is(operation: string): boolean {
        return this.operation === operation;
    }

    public canUse(): boolean {
        return true;
    }

    public matches({
        value: initialValue,
        compareValue: initialCompareValue
    }: ValueFilter.MatchesParams): ValueFilter.Result {
        if (!initialValue || (Array.isArray(initialValue) && initialValue.length === 0)) {
            return false;
        } else if (initialCompareValue === undefined || initialCompareValue === null) {
            return true;
        }
        const values = createValues(initialValue);
        const compareValues = createCompareValues(initialCompareValue);
        if (compareValues.length === 0) {
            return false;
        }
        return values.some(target => {
            return compareValues.every(compareValue => {
                return target.match(new RegExp(compareValue, "gi")) !== null;
            });
        });
    }
}

export const ContainsFilter = ValueFilter.createImplementation({
    implementation: ContainsFilterImpl,
    dependencies: []
});
