# Plan: Migrate `@webiny/react-properties` to MobX

## Context

The `react-properties` package manages hierarchical property data as a flat array using React `useState` + Context. Every `addProperty` call triggers a state update that re-renders ALL consumers. The goal is to replace this with a MobX `PropertyStore` class so mutations are batched, computed values are cached, and only consumers that actually read changed data re-render. The external API must stay 100% identical — all existing tests must pass without changing assertions or mock data.

---

## Critical Invariants

1. **`$isFirst: false` and `$isLast: false` on ALL properties** — tests assert these fields on every property, not just positioned ones. The store must normalize them to `false` via `?? false` on every `addProperty`/`replaceProperty`.
2. **`mergeProperty` semantics** — `addProperty` with an existing ID merges (`{...existing, ...incoming}`), never replaces; order is preserved unless `before`/`after` is also given.
3. **`replaceProperty` ordering safety** — old ID must stay in `_order` during `_removeDescendants` so the position isn't lost due to splice index-shifts; swap ID in-place _after_ descendants are removed.
4. **`$first` / `$last` position markers** — `before="...$first"` → `unshift`; `after="...$last"` → `push`.
5. **Do NOT change `useEffect([], [])` deps in `Property`** — keep empty dep array for mount/unmount; value-changes are handled by the second `useEffect([value])`.
6. **Remove `DebounceRenderer`** — it existed only to workaround React batching; MobX `runInAction` batches all mutations atomically, making it unnecessary.

---

## Files to Create

### `src/domain/PropertyStore.ts`

Pure MobX class, no React dependency.

```typescript
import { makeObservable, observable, computed, runInAction } from "mobx";
import type { Property } from "../Properties.js";
import { toObject } from "../utils.js";

interface AddPropertyOptions {
  after?: string;
  before?: string;
}

export class PropertyStore {
  _map: Map<string, Property> = new Map(); // O(1) lookup
  _order: string[] = []; // ordered IDs

  constructor() {
    makeObservable(this, {
      _map: observable,
      _order: observable,
      allProperties: computed,
      config: computed
    });
  }

  get allProperties(): Property[] {
    return this._order.map(id => this._map.get(id)).filter((p): p is Property => p !== undefined);
  }

  get config(): unknown {
    return toObject(this.allProperties);
  }

  getAllProperties(): Property[] {
    return this.allProperties;
  }
  getProperty(id: string): Property | undefined {
    return this._map.get(id);
  }
  getConfig<T = unknown>(): T {
    return this.config as T;
  }

  addProperty(property: Property, options: AddPropertyOptions = {}): void {
    const normalized = {
      ...property,
      $isFirst: property.$isFirst ?? false,
      $isLast: property.$isLast ?? false
    };
    runInAction(() => {
      const existingIdx = this._order.indexOf(normalized.id);
      if (existingIdx > -1) {
        this._map.set(normalized.id, { ...this._map.get(normalized.id)!, ...normalized });
        if (options.after || options.before) this._reposition(normalized.id, options);
      } else {
        this._map.set(normalized.id, normalized);
        if (options.after) this._insertAfter(normalized.id, options.after);
        else if (options.before) this._insertBefore(normalized.id, options.before);
        else this._order.push(normalized.id);
      }
    });
  }

  removeProperty(id: string): void {
    runInAction(() => {
      const idx = this._order.indexOf(id);
      if (idx > -1) this._order.splice(idx, 1);
      this._map.delete(id);
      this._removeDescendants(id);
    });
  }

  replaceProperty(oldId: string, newProperty: Property): void {
    const normalized = {
      ...newProperty,
      $isFirst: newProperty.$isFirst ?? false,
      $isLast: newProperty.$isLast ?? false
    };
    runInAction(() => {
      const oldIdx = this._order.indexOf(oldId);
      if (oldIdx === -1) {
        this.addProperty(normalized);
        return;
      }
      this._map.delete(oldId);
      this._removeDescendants(oldId); // may splice _order
      const currentIdx = this._order.indexOf(oldId); // find again after splices
      if (currentIdx > -1) this._order[currentIdx] = normalized.id;
      else this._order.splice(oldIdx, 0, normalized.id); // fallback
      this._map.set(normalized.id, normalized);
    });
  }

  private _removeDescendants(parentId: string): void {
    const children = [...this._map.entries()]
      .filter(([, p]) => p.parent === parentId)
      .map(([id]) => id);
    for (const id of children) {
      this._removeDescendants(id);
      const idx = this._order.indexOf(id);
      if (idx > -1) this._order.splice(idx, 1);
      this._map.delete(id);
    }
  }

  private _insertBefore(propertyId: string, beforeId: string): void {
    if (beforeId.endsWith("$first")) {
      this._order.unshift(propertyId);
      return;
    }
    const idx = this._order.indexOf(beforeId);
    idx > -1 ? this._order.splice(idx, 0, propertyId) : this._order.push(propertyId);
  }

  private _insertAfter(propertyId: string, afterId: string): void {
    if (afterId.endsWith("$last")) {
      this._order.push(propertyId);
      return;
    }
    const idx = this._order.indexOf(afterId);
    idx > -1 ? this._order.splice(idx + 1, 0, propertyId) : this._order.push(propertyId);
  }

  private _reposition(propertyId: string, options: AddPropertyOptions): void {
    const idx = this._order.indexOf(propertyId);
    if (idx > -1) this._order.splice(idx, 1);
    if (options.after) this._insertAfter(propertyId, options.after);
    else if (options.before) this._insertBefore(propertyId, options.before);
    else this._order.push(propertyId);
  }
}
```

### `src/domain/index.ts`

```typescript
export { PropertyStore } from "./PropertyStore.js";
```

---

## Files to Modify

### `src/Properties.tsx`

**Remove:**

- `useState` import
- `removeByParent`, `putPropertyBefore`, `putPropertyAfter`, `mergeProperty` functions
- `AddPropertyOptions` interface (now lives in `PropertyStore`)

**Add:**

- `import { reaction } from "mobx"`
- `import { PropertyStore } from "./domain/PropertyStore.js"`
- `useRef` (already imported; drop `useState`)

**`PropertiesContext` interface** — add `store: PropertyStore`, keep `properties` as a getter:

```typescript
interface PropertiesContext {
  name?: string;
  store: PropertyStore;
  get properties(): Property[];
  getAncestor(name: string): PropertiesContext | undefined;
  getObject<T = unknown>(): T;
  addProperty(property: Property, options?: AddPropertyOptions): void;
  removeProperty(id: string): void;
  replaceProperty(id: string, property: Property): void;
}
```

**`Properties` component** — replace `useState` with `useRef<PropertyStore>`:

```typescript
export const Properties = ({ name, onChange, children }: PropertiesProps) => {
    const storeRef = useRef<PropertyStore | null>(null);
    if (!storeRef.current) storeRef.current = new PropertyStore();
    const store = storeRef.current;

    let parent: PropertiesContext | undefined;
    try { parent = useProperties(); } catch { /* no parent */ }

    useEffect(() => {
        if (!onChange) return;
        const disposer = reaction(
            () => store.getAllProperties(),
            (props) => onChange(props),
            { fireImmediately: true }
        );
        return () => disposer();
    }, [onChange]);

    const context: PropertiesContext = useMemo(
        () => ({
            name,
            store,
            get properties() { return store.getAllProperties(); },
            getAncestor(ancestorName) {
                if (!parent) return undefined;
                return parent.name === ancestorName ? parent : parent.getAncestor(ancestorName);
            },
            getObject<T>() { return store.getConfig<T>(); },
            addProperty(property, options) { store.addProperty(property, options); },
            removeProperty(id) { store.removeProperty(id); },
            replaceProperty(id, property) { store.replaceProperty(id, property); },
        }),
        [store, name, parent]
    );

    return <PropertiesContext.Provider value={context}>{children}</PropertiesContext.Provider>;
};
```

**`useAncestorByName`** — fix deps to include `parent`:

```typescript
return useMemo(() => { ... }, [name, parent]);
```

**`Property` component:**

- Change `useMemo(() => id || getUniqueId(), [])` → deps `[id]`
- Keep `useEffect` mount/unmount with `[]` deps unchanged
- Keep second `useEffect([value])` unchanged

### `src/createConfigurableComponent.tsx`

**Remove:**

- `import debounce from "lodash/debounce.js"`
- `DebounceRenderer` component entirely
- `ViewContext` and `useState<Property[]>` in `WithConfig`
- `useEffect` calling `onProperties`

**Simplest approach (keeps `useConfig()` callers unchanged — no `observer()` required):**

Keep a local `useState` in `WithConfig` updated via `onChange` from `Properties`. `useConfig()` reads from `ViewContext` exactly as before:

```typescript
const WithConfig = ({ onProperties, children }: WithConfigProps) => {
    const [properties, setProperties] = useState<Property[]>([]);
    useDebugConfig(name, properties);

    const handleChange = useCallback((props: Property[]) => {
        setProperties(props);
        onProperties?.(props);
    }, [onProperties]);

    return (
        <ViewContext.Provider value={{ properties }}>
            <Properties onChange={handleChange}>
                <ConfigApplyPrimary />
                <ConfigApplySecondary />
                {children}
            </Properties>
        </ViewContext.Provider>
    );
};
```

`useConfig()` stays identical — no changes needed:

```typescript
function useConfig<TExtra extends object>(): TConfig & TExtra {
  const { properties } = useContext(ViewContext);
  return useMemo(() => toObject<TConfig & TExtra>(properties), [properties]);
}
```

> The `DebounceRenderer` is replaced by MobX's native batching: all child `useEffect` calls that invoke `addProperty` run synchronously before MobX reactions fire, so `onChange` is called once with the final state.

### `src/index.ts`

Add at the end:

```typescript
export * from "./domain/index.js";
```

### `package.json`

Add to `dependencies`:

```json
"mobx": "^6.13.5",
"mobx-react-lite": "^3.4.3"
```

Remove `lodash` from dependencies (no longer used after removing debounce import).

---

## Test Compatibility

- **No test assertion changes** — all assertions remain identical
- **`$isFirst: false, $isLast: false`** — `PropertyStore` normalizes these on every `addProperty`
- `toObject()` in `utils.ts` is unchanged
- `onChange` is called with the same flat `Property[]` shape
- All test cases (positioning, merging, replacement, removal) handled by same logic now inside `PropertyStore`

---

## Verification

```bash
yarn test packages/react-properties 2>&1 | tail -50
```

Test files that must all pass:

- `__tests__/properties.test.tsx`
- `__tests__/cases/pbEditorSettings/pbEditorSettings.test.tsx`
- `__tests__/cases/gql-query-builder/gqlBuilder.test.tsx`
- `__tests__/cases/docs/docs.test.tsx`

## Coding Style

- always include `{}` even for one-liners
- do not use `_` prefix for private fields
