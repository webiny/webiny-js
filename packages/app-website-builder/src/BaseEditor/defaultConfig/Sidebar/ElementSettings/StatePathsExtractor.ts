import { immutableGet } from "@webiny/app/utils";
import { StatePathsCollection, type PathOption } from "./StatePathsCollection.js";
import { PathType } from "./PathType.js";

export class StatePathsExtractor {
    private readonly state: Record<string, any>;

    constructor(state: Record<string, any>) {
        this.state = state;
    }

    public getPaths(): StatePathsCollection {
        return new StatePathsCollection(this.extractPaths(this.state));
    }

    private extractPaths(
        obj: any,
        path: string[] = [],
        labelPath: string[] = [],
        result: PathOption[] = []
    ): PathOption[] {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = [...path, key];
            const currentLabelPath = [...labelPath, this.toLabel(key)];
            const valueType = this.getValueType(value);

            const dotPath = `$state.${currentPath.join(".")}`;
            const label = currentLabelPath.join(" → ");

            result.push({ value: dotPath, label, type: valueType });

            if (valueType.matches("object")) {
                this.extractPaths(value, currentPath, currentLabelPath, result);
            }

            if (valueType.matches("array")) {
                // @ts-expect-error We know it's an array.
                for (let i = 0; i < value.length; i++) {
                    // @ts-expect-error We know it's an array.
                    const item = value[i];
                    const indexedPath = [...currentPath, String(i)];
                    const itemType = this.getValueType(item);

                    const labelWithIndex = `${this.toLabel(key)} [${i}]`;
                    const indexedLabelPath = [...labelPath, labelWithIndex];

                    const itemDotPath = `$state.${indexedPath.join(".")}`;
                    const itemLabel = indexedLabelPath.join(" → ");

                    result.push({ value: itemDotPath, label: itemLabel, type: itemType });

                    if (itemType.matches("object")) {
                        this.extractPaths(item, indexedPath, indexedLabelPath, result);
                    }
                }
            }
        }

        return result;
    }

    public getChildPaths(path: string): StatePathsCollection {
        const rawPath = path.replace(/^\$state\./, "");
        const node = immutableGet(this.state, rawPath);

        if (node === undefined || node === null) {
            return new StatePathsCollection([]);
        }

        const baseLabel = this.toLabel(rawPath.split(".").pop() || "");

        // If array, assume inspecting the first item
        const target = Array.isArray(node) ? node[0] : node;

        if (typeof target !== "object" || target === null) {
            return new StatePathsCollection([]);
        }

        const result: PathOption[] = [];
        this.extractRelativeNoIndexPaths(target, [], [baseLabel], result);

        return new StatePathsCollection(
            result.map(opt => ({
                ...opt,
                value: `$.${opt.value}`
            }))
        );
    }

    private extractRelativeNoIndexPaths(
        obj: any,
        path: string[] = [],
        labelPath: string[] = [],
        result: PathOption[] = []
    ): void {
        for (const [key, value] of Object.entries<any>(obj)) {
            const currentPath = [...path, key];
            const currentLabelPath = [...labelPath, this.toLabel(key)];
            const type = this.getValueType(value);

            result.push({
                value: currentPath.join("."),
                label: currentLabelPath.join(" → "),
                type
            });

            if (type.matches("object")) {
                this.extractRelativeNoIndexPaths(value, currentPath, currentLabelPath, result);
            }

            if (type.isArray() && value.length > 0 && typeof value[0] === "object") {
                this.extractRelativeNoIndexPaths(value[0], currentPath, currentLabelPath, result);
            }
        }
    }

    private toLabel(key: string): string {
        return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, str => str.toUpperCase());
    }

    private getValueType(value: any): PathType {
        if (Array.isArray(value)) {
            return new PathType("array");
        }

        if (value === null) {
            return new PathType("null");
        }

        return new PathType(typeof value);
    }
}
