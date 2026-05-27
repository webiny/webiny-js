/**
 * Validates LLM-generated page content against the component catalog.
 * Recursively walks the element tree (including nested CreateElement actions
 * inside slot inputs) and removes any element whose component name is not
 * in the catalog. Tool envelopes are left untouched.
 */
export class ComponentFilter {
    private readonly validNames: Set<string>;

    constructor(components: Array<{ name: string }>) {
        this.validNames = new Set(components.map(c => c.name));
    }

    filter(elements: unknown[]): unknown[] {
        return elements
            .filter(el => this.isValid(el))
            .map(el => this.processInputs(el as Record<string, unknown>));
    }

    private isValid(el: unknown): boolean {
        if (!el || typeof el !== "object") {
            return true;
        }

        const obj = el as Record<string, unknown>;

        if ("component" in obj && typeof obj.component === "string") {
            return this.validNames.has(obj.component);
        }

        if (obj.action === "CreateElement" && obj.params && typeof obj.params === "object") {
            const params = obj.params as Record<string, unknown>;
            if ("component" in params && typeof params.component === "string") {
                return this.validNames.has(params.component);
            }
        }

        return true;
    }

    private processInputs(el: Record<string, unknown>): Record<string, unknown> {
        const inputs = this.getInputs(el);
        if (!inputs) {
            return el;
        }

        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(inputs)) {
            cleaned[key] = this.processValue(value);
        }

        return this.setInputs(el, cleaned);
    }

    private getInputs(el: Record<string, unknown>): Record<string, unknown> | null {
        if ("inputs" in el && el.inputs && typeof el.inputs === "object") {
            return el.inputs as Record<string, unknown>;
        }

        if (
            el.action === "CreateElement" &&
            el.params &&
            typeof el.params === "object" &&
            "inputs" in (el.params as Record<string, unknown>)
        ) {
            const params = el.params as Record<string, unknown>;
            return params.inputs as Record<string, unknown>;
        }

        return null;
    }

    private setInputs(
        el: Record<string, unknown>,
        inputs: Record<string, unknown>
    ): Record<string, unknown> {
        if ("inputs" in el) {
            return { ...el, inputs };
        }

        if (el.action === "CreateElement" && el.params && typeof el.params === "object") {
            return { ...el, params: { ...el.params, inputs } };
        }

        return el;
    }

    private processValue(value: unknown): unknown {
        if (Array.isArray(value)) {
            return value.filter(item => this.isValid(item)).map(item => this.processValue(item));
        }

        if (!value || typeof value !== "object") {
            return value;
        }

        const obj = value as Record<string, unknown>;

        if ("tool" in obj) {
            return value;
        }

        if (obj.action === "CreateElement") {
            if (!this.isValid(obj)) {
                return null;
            }
            return this.processInputs(obj);
        }

        if ("component" in obj && "inputs" in obj) {
            return this.processInputs(obj);
        }

        const result: Record<string, unknown> = {};
        let changed = false;
        for (const [k, v] of Object.entries(obj)) {
            const processed = this.processValue(v);
            result[k] = processed;
            if (processed !== v) {
                changed = true;
            }
        }
        return changed ? result : value;
    }
}
