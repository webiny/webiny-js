react-properties is a declarative configuration-as-JSX library. It lets you define structured data
(configuration, settings, navigation trees, GraphQL queries, etc.) using React component composition,
then extracts that data as plain JavaScript objects. It renders no UI — it's purely a data-declaration
mechanism using the React component tree.

Core Concept

Instead of defining config as JSON or plain objects, you compose <Property> components in JSX. The
library collects all property nodes, resolves their hierarchy, and emits a flat list of property
records via an onChange callback. A toObject() helper converts that flat list into a nested JS object.

Architecture (PropertyStore + Debounced Queue)

The internals use a PropertyStore class (src/domain/PropertyStore.ts) that decouples mutation from
rendering:

```
<Property> useEffect        <Property> useEffect        <Property> useEffect
     │                           │                           │
     ▼                           ▼                           ▼
store.addProperty()         store.addProperty()         store.addProperty()
  (pushes to queue)           (pushes to queue)           (pushes to queue)
     │                           │                           │
     └──── debounce(0) coalesces all ops ────────────────────┘
                                 │
                    processQueue() runs once
                                 │
                    store.subscribe() listeners fire
                                 │
                    onChange(finalProperties)  ← called ONCE
```

Key design decisions:

1. Debounced operation queue — Each addProperty/removeProperty/replaceProperty call pushes an
   operation descriptor onto a plain array and schedules a lodash debounce(0) flush. The flush
   processes ALL queued ops in a single pass, then notifies subscribers once.

2. Stable React Context — The <Properties> component creates the PropertyStore in a useRef and
   builds a context value with useMemo([store]). Since the store reference never changes, the
   context value is stable — children NEVER re-render due to context changes. This eliminates
   the O(N²) render cascade that the old useState-based approach had.

3. Subscriber pattern — Properties registers an onChange listener via store.subscribe() in a
   useEffect. The store notifies listeners after each queue flush. No React state is involved
   in the core mutation path.

4. No MobX, no observer — The store is plain JS. No observables, no reactions, no makeAutoObservable.
   The only external dependency is lodash/debounce.

File Layout

- src/domain/PropertyStore.ts — The store class (queue, map, order, subscribe/notify)
- src/domain/index.ts — Barrel export
- src/Properties.tsx — <Properties>, <Property>, hooks (useProperties, useParentProperty, etc.)
- src/createConfigurableComponent.tsx — Higher-level configurable component factory
- src/utils.ts — toObject(), getUniqueId()
- src/useIdGenerator.ts — Scoped ID generation hook
- src/useDebugConfig.ts — Debug logging hook

Key Components & APIs

┌──────────────────────────────────────────┬───────────────────────────────────────────────────────┐
│ Export                                   │ Role                                                  │
├──────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ <Properties onChange={fn}> │ Root container. Collects all child <Property> nodes │
│ │ and calls onChange with the flat list. │
├──────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ <Property id name value array remove │ A single property node. Can nest to create hierarchy. │
│ replace after before> │ │
├──────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ PropertyStore │ The backing store class. Exposed from │
│ │ src/domain/index.ts. │
├──────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ toObject(properties) │ Converts the flat property list into a nested JS │
│ │ object/array. │
├──────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ useParentProperty() │ Hook to access the parent <Property> from within a │
│ │ child — used for building scoped IDs. │
├──────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ useIdGenerator(prefix) │ Hook to generate namespaced IDs for properties. │
└──────────────────────────────────────────┴───────────────────────────────────────────────────────┘

How Properties Map to Objects

- Nesting: <Property name="group"><Property name="name" value="x" /></Property> → { group: { name: "x"
  } }
- Arrays: When multiple <Property> share the same name at the same level (or use array={true}), they
  become an array: { group: [{ ... }, { ... }] }
- Leaf values: <Property name="label" value="Hello" /> → { label: "Hello" }

Composability & Merging (the killer feature)

Properties with matching IDs are merged, not duplicated. This enables a powerful plugin/extension
pattern:

1. Base definition declares groups and fields.
2. A separate block references the same group by name/id and can:
   - Add new child properties (they merge in).
   - Override existing values (last writer wins for scalar props like label).
   - Remove a property (remove={true}).
   - Replace a property (replace="targetId" — takes the position of the target).
   - Reorder with before="id" or after="id".

This is how different plugins or modules can independently contribute to and customize the same
configuration tree without knowing about each other.

Testing Notes

Because the PropertyStore uses debounce(0), tests must await the flush before asserting on onChange
results. The test utility flush() (in __tests__/utils.ts) wraps a 10ms setTimeout in act():

```ts
import { flush } from "./utils";

render(view);
await flush();

const properties = getLastCall(onChange);
```

Real-World Use Cases (from test cases)

1. Page Builder Editor Settings — Groups of form fields that plugins can add to, remove from, reorder,
   or replace.
2. GraphQL Query Builder — Composing queries/mutations/fields/variables as JSX, then converting to
   query strings.
3. Documentation Navigation — Building large nested nav trees with sections, collapsibles, and pages.
4. App Module Config — Registering routes, menus, repositories, and decorators via composition.

In Short

react-properties is a configuration composition engine that uses React's component model to let
multiple independent modules declaratively contribute to, override, and reorder a shared configuration
object — all through JSX. The PropertyStore + debounced queue architecture ensures O(N) performance
even with thousands of properties.
