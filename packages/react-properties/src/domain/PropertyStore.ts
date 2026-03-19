import debounce from "lodash/debounce.js";
import type { Property } from "../Properties.js";

interface AddPropertyOptions {
    after?: string;
    before?: string;
    priority?: number;
}

type Operation =
    | { type: "add"; property: Property; options: AddPropertyOptions }
    | { type: "remove"; id: string }
    | { type: "replace"; oldId: string; newProperty: Property };

type Listener = (properties: Property[]) => void;

export class PropertyStore {
    private map = new Map<string, Property>();
    private order: string[] = [];
    private queue: Operation[] = [];
    private listeners = new Set<Listener>();
    private priorities = new Map<string, number>();
    /** Properties that were explicitly positioned via before/after. */
    private positioned = new Set<string>();

    /**
     * Synchronous lookup map — written immediately on addProperty (before debounce),
     * so useAncestor can find properties during render.
     */
    private lookup = new Map<string, Property>();

    private scheduleFlush = debounce(() => {
        this.processQueue();
    }, 0);

    get allProperties(): Property[] {
        return this.order.filter(id => this.map.has(id)).map(id => this.map.get(id)!);
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Returns properties that are children of the given parent ID.
     * Reads from the synchronous lookup map, so it works during render
     * before the debounced queue has flushed.
     */
    getChildrenOf(parentId: string): Property[] {
        return Array.from(this.lookup.values()).filter(p => p.parent === parentId);
    }

    /**
     * Find a property by ID from the synchronous lookup map.
     */
    getById(id: string): Property | undefined {
        return this.lookup.get(id);
    }

    /**
     * Register a property in the synchronous lookup map during render,
     * so useAncestor can find it before the debounced queue flushes.
     */
    registerLookup(property: Property): void {
        if (this.lookup.has(property.id)) {
            const existing = this.lookup.get(property.id)!;
            this.lookup.set(property.id, { ...existing, ...property });
        } else {
            this.lookup.set(property.id, property);
        }
    }

    addProperty(property: Property, options: AddPropertyOptions = {}): void {
        this.registerLookup(property);
        this.queue.push({ type: "add", property, options });
        this.scheduleFlush();
    }

    removeProperty(id: string): void {
        this.lookup.delete(id);
        this.queue.push({ type: "remove", id });
        this.scheduleFlush();
    }

    replaceProperty(oldId: string, newProperty: Property): void {
        this.lookup.delete(oldId);
        this.lookup.set(newProperty.id, newProperty);
        this.queue.push({ type: "replace", oldId, newProperty });
        this.scheduleFlush();
    }

    private processQueue(): void {
        if (this.queue.length === 0) {
            return;
        }

        const ops = this.queue.splice(0);

        // Stable-sort operations so that "add" ops with lower priority numbers
        // are processed first. Non-add operations and adds with default priority (0)
        // keep their original order.
        ops.sort((a, b) => {
            const pa = a.type === "add" ? (a.options.priority ?? 0) : 0;
            const pb = b.type === "add" ? (b.options.priority ?? 0) : 0;
            return pa - pb;
        });

        for (const op of ops) {
            switch (op.type) {
                case "add":
                    this.executeAdd(op.property, op.options);
                    break;
                case "remove":
                    this.executeRemove(op.id);
                    break;
                case "replace":
                    this.executeReplace(op.oldId, op.newProperty);
                    break;
            }
        }

        // Stable-sort the order array by priority, but only for properties
        // that were NOT explicitly positioned via before/after. Explicitly
        // positioned properties keep their placement.
        this.order.sort((a, b) => {
            if (this.positioned.has(a) || this.positioned.has(b)) {
                return 0;
            }
            return (this.priorities.get(a) ?? 0) - (this.priorities.get(b) ?? 0);
        });

        const properties = this.allProperties;
        for (const listener of this.listeners) {
            listener(properties);
        }
    }

    private executeAdd(property: Property, options: AddPropertyOptions): void {
        if (options.after || options.before) {
            this.positioned.add(property.id);
        }

        const exists = this.map.has(property.id);

        if (exists) {
            // Merge into existing property. Keep the original priority so
            // that a secondary config overriding a primary property doesn't
            // cause the re-sort to move it after all primary properties.
            const existing = this.map.get(property.id)!;
            this.map.set(property.id, { ...existing, ...property });

            if (options.after) {
                this.reposition(property.id, options.after, "after");
            } else if (options.before) {
                this.reposition(property.id, options.before, "before");
            }
            return;
        }

        this.map.set(property.id, property);
        // Set priority only for new properties — not merges (handled above).
        this.priorities.set(property.id, options.priority ?? 0);

        if (options.after) {
            this.insertAfter(property.id, options.after);
        } else if (options.before) {
            this.insertBefore(property.id, options.before);
        } else {
            this.order.push(property.id);
        }
    }

    private executeRemove(id: string): void {
        if (!this.map.has(id)) {
            return;
        }
        this.map.delete(id);
        this.priorities.delete(id);
        this.positioned.delete(id);
        this.order = this.order.filter(oid => oid !== id);
        // Note: we intentionally do NOT call removeDescendants here.
        // React's component lifecycle ensures that when a parent Property
        // unmounts, all child Properties unmount too — each triggering its
        // own removeProperty call. Calling removeDescendants would wipe
        // children that belong to OTHER still-mounted configs sharing the
        // same parent ID (e.g., id="pageSettings" used by both primary
        // and secondary configs).
    }

    private executeReplace(oldId: string, newProperty: Property): void {
        const idx = this.order.indexOf(oldId);
        if (idx === -1) {
            return;
        }

        this.map.delete(oldId);
        this.map.set(newProperty.id, newProperty);
        this.order[idx] = newProperty.id;
        this.removeDescendants(oldId);
    }

    private insertBefore(id: string, before: string): void {
        if (before.endsWith("$first")) {
            this.order.unshift(id);
            return;
        }
        const targetIdx = this.order.indexOf(before);
        if (targetIdx === -1) {
            this.order.push(id);
            return;
        }
        this.order.splice(targetIdx, 0, id);
    }

    private insertAfter(id: string, after: string): void {
        if (after.endsWith("$last")) {
            this.order.push(id);
            return;
        }
        const targetIdx = this.order.indexOf(after);
        if (targetIdx === -1) {
            this.order.push(id);
            return;
        }
        this.order.splice(targetIdx + 1, 0, id);
    }

    private reposition(id: string, targetId: string, position: "before" | "after"): void {
        this.order = this.order.filter(oid => oid !== id);

        if (position === "before") {
            this.insertBefore(id, targetId);
        } else {
            this.insertAfter(id, targetId);
        }
    }

    private removeDescendants(parentId: string): void {
        const children = Array.from(this.map.values()).filter(p => p.parent === parentId);
        for (const child of children) {
            this.map.delete(child.id);
            this.order = this.order.filter(oid => oid !== child.id);
            this.removeDescendants(child.id);
        }
    }
}
