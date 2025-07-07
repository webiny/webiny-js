import { DocumentElementBindings } from "~/sdk/types";
import { InputAstNode } from "~/sdk/ComponentManifestToAstConverter";

export type InheritanceInfo = {
    inputs: Record<
        string,
        {
            overridden: boolean;
            inheritedFrom?: string;
        }
    >;
    styles: Record<
        string,
        {
            overridden: boolean;
            inheritedFrom?: string;
        }
    >;
};

export class InheritanceProcessor {
    private breakpoints: string[];
    private responsiveInputPaths: Set<string>;

    constructor(breakpoints: string[], inputsAst: InputAstNode[]) {
        this.breakpoints = breakpoints;
        this.responsiveInputPaths = this.getResponsiveInputPaths(inputsAst);
    }

    public getInheritanceMap(bindings: DocumentElementBindings, breakpoint: string) {
        const overrides = bindings.overrides ?? {};
        const inputs = bindings.inputs ?? {};
        const styles = bindings.styles ?? {};

        const upTo = Math.max(this.breakpoints.indexOf(breakpoint), 0);
        const currentBpIndex = this.breakpoints.indexOf(breakpoint);

        // Maps now store sets of all override indices per key for correct ancestor lookup
        const overriddenInputsMap = new Map<string, Set<number>>();
        const overriddenStylesMap = new Map<string, Set<number>>();

        // 1) Merge overrides and track all override indices for inputs and styles
        for (let i = 0; i <= upTo; i++) {
            const bp = this.breakpoints[i];
            const override = overrides[bp];
            if (!override) {
                continue;
            }

            if (override.inputs) {
                for (const key in override.inputs) {
                    if (!overriddenInputsMap.has(key)) {
                        overriddenInputsMap.set(key, new Set());
                    }
                    overriddenInputsMap.get(key)!.add(i);
                }
            }
            if (override.styles) {
                for (const key in override.styles) {
                    if (!overriddenStylesMap.has(key)) {
                        overriddenStylesMap.set(key, new Set());
                    }
                    overriddenStylesMap.get(key)!.add(i);
                }
            }
        }

        // Also consider base bindings as overrides at index 0 if not already present
        for (const key in inputs) {
            if (!overriddenInputsMap.has(key)) {
                overriddenInputsMap.set(key, new Set([0]));
            } else {
                overriddenInputsMap.get(key)!.add(0);
            }
        }
        for (const key in styles) {
            if (!overriddenStylesMap.has(key)) {
                overriddenStylesMap.set(key, new Set([0]));
            } else {
                overriddenStylesMap.get(key)!.add(0);
            }
        }

        // 2) Compute inheritance info for inputs
        const inputsInheritance: InheritanceInfo["inputs"] = {};
        for (const key of Object.keys(inputs)) {
            const normalizedKey = this.normalizeBindingKey(key);
            const isResponsive = this.responsiveInputPaths.has(normalizedKey);
            // Skip non-responsive input keys
            if (!isResponsive) {
                continue;
            }

            // If responsive, normalize key to ignore indexes for inheritance checks
            const lookupKey = isResponsive ? normalizedKey : key;

            // Find the greatest index <= currentBpIndex where key is overridden
            const overrideIndices = overriddenInputsMap.get(lookupKey) ?? new Set();

            let lastOverrideIndex = -1;
            for (const idx of overrideIndices) {
                if (idx <= currentBpIndex && idx > lastOverrideIndex) {
                    lastOverrideIndex = idx;
                }
            }

            const overridden = lastOverrideIndex === currentBpIndex;

            // Find nearest ancestor breakpoint less than currentBpIndex
            let inheritedFromIndex = 0; // Use `desktop` as fallback.
            for (let j = currentBpIndex - 1; j >= 0; j--) {
                if (overrideIndices.has(j)) {
                    inheritedFromIndex = j;
                    break;
                }
            }

            const inheritedFrom =
                inheritedFromIndex >= 0 ? this.breakpoints[inheritedFromIndex] : undefined;

            inputsInheritance[key] = {
                overridden,
                inheritedFrom: breakpoint === inheritedFrom ? undefined : inheritedFrom
            };
        }

        // 3) Compute inheritance info for styles
        const stylesInheritance: InheritanceInfo["styles"] = {};
        const keys = new Set([...Object.keys(styles), ...Array.from(overriddenStylesMap.keys())]);

        for (const key of keys) {
            const overrideIndices = overriddenStylesMap.get(key) ?? new Set();

            let lastOverrideIndex = -1;
            for (const idx of overrideIndices) {
                if (idx <= currentBpIndex && idx > lastOverrideIndex) {
                    lastOverrideIndex = idx;
                }
            }

            const overridden = lastOverrideIndex === currentBpIndex;

            let inheritedFromIndex = 0; // Use `desktop` as fallback.
            for (let j = currentBpIndex - 1; j >= 0; j--) {
                if (overrideIndices.has(j)) {
                    inheritedFromIndex = j;
                    break;
                }
            }

            const inheritedFrom =
                inheritedFromIndex >= 0 ? this.breakpoints[inheritedFromIndex] : undefined;

            stylesInheritance[key] = {
                overridden,
                inheritedFrom: breakpoint === inheritedFrom ? undefined : inheritedFrom
            };
        }

        return {
            inputs: inputsInheritance,
            styles: stylesInheritance
        };
    }

    private normalizeBindingKey(path: string): string {
        return path.replace(/\[\d+\]/g, "");
    }

    private getResponsiveInputPaths(inputsAst: InputAstNode[]): Set<string> {
        const responsivePaths = new Set<string>();

        const traverse = (nodes: InputAstNode[], prefix: string[]) => {
            for (const node of nodes) {
                const currentPath = [...prefix, node.name].join("/");
                if (node.input?.responsive) {
                    responsivePaths.add(currentPath);
                }
                if (node.children.length) {
                    traverse(node.children, [...prefix, node.name]);
                }
            }
        };

        traverse(inputsAst, []);
        return responsivePaths;
    }
}
