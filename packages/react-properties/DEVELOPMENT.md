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
                      (stable-sorts by priority,
                       then processes all ops)
                                 │
                    store.subscribe() listeners fire
                                 │
                    onChange(finalProperties)  ← called ONCE
```

Key design decisions:

1. Debounced operation queue — Each addProperty/removeProperty/replaceProperty call pushes an
   operation descriptor onto a plain array and schedules a lodash debounce(0) flush. The flush
   processes ALL queued ops in a single pass, then notifies subscribers once.

2. Priority-aware sorting — Before processing, processQueue() stable-sorts "add" operations by a
   numeric `priority` field (default 0). Lower priority numbers are processed first. This ensures
   primary config (priority 0) is always added before secondary/extension config (priority 1),
   regardless of render order in the React tree. See PropertyPriority.tsx.

3. Stable React Context — The <Properties> component creates the PropertyStore in a useRef and
   builds a context value with useMemo([store]). Since the store reference never changes, the
   context value is stable — children NEVER re-render due to context changes. This eliminates
   the O(N²) render cascade that the old useState-based approach had.

4. Subscriber pattern — Properties registers an onChange listener via store.subscribe() in a
   useEffect. The store notifies listeners after each queue flush. No React state is involved
   in the core mutation path.

5. Synchronous lookup map — The store maintains a separate `lookup` Map that is written to
   immediately during render (via registerLookup()), before the debounced queue flushes. This
   allows useAncestor() to find properties during render. Methods: registerLookup(),
   getChildrenOf(), getById().

6. No MobX, no observer — The store is plain JS. No observables, no reactions, no makeAutoObservable.
   The only external dependency is lodash/debounce.

File Layout

- src/domain/PropertyStore.ts — The store class (queue, map, order, subscribe/notify, lookup)
- src/domain/index.ts — Barrel export
- src/Properties.tsx — <Properties>, <Property>, hooks (useProperties, useParentProperty, etc.)
- src/PropertyPriority.tsx — React context providing numeric priority to descendant <Property> components
- src/createConfigurableComponent.tsx — Higher-level configurable component factory (see below)
- src/utils.ts — toObject(), getUniqueId()
- src/useIdGenerator.ts — Scoped ID generation hook
- src/useDebugConfig.ts — Debug logging hook

Key Components & APIs

┌──────────────────────────────────────────┬───────────────────────────────────────────────────────┐
│ Export │ Role │
├──────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ <Properties onChange={fn}> │ Root container. Collects all child <Property> nodes │
│ │ and calls onChange with the flat list. │
├──────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ <Property id name value array remove │ A single property node. Can nest to create hierarchy. │
│ replace after before root parent> │ Reads usePropertyPriority() and passes it as an │
│ │ option to addProperty. │
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
├──────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ PropertyPriorityProvider │ React context provider that sets a numeric priority │
│ │ for all descendant <Property> components. │
├──────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ usePropertyPriority() │ Hook returning the current priority (default 0). │
└──────────────────────────────────────────┴───────────────────────────────────────────────────────┘

createConfigurableComponent (src/createConfigurableComponent.tsx)

This factory creates a Config/WithConfig/useConfig trio for any configurable component.

Returns: { Config, WithConfig, useConfig }

Architecture:

```
<Config priority="primary">        <Config priority="secondary">
   ↓ via Compose                      ↓ via Compose
ConfigApplyPrimary (decoratable)   ConfigApplySecondary (decoratable)
        │                                   │
        └─── wrapped in ConfigApplyTree (React.memo) ───┘
                           │
                 <Properties onChange={stateUpdater}>
                     <ConfigApplyTree />
                 </Properties>
                           │
              PropertyStore collects, debounce flushes
                           │
                 setProperties(flatList)
                           │
              {properties !== null ? children : null}
```

Key design decisions:

1. Primary/Secondary split — ConfigApplyPrimary and ConfigApplySecondary are separate decoratable
   components. Config routes to one or the other based on its `priority` prop. Secondary is wrapped
   in PropertyPriorityProvider(priority=1) so its properties are always sorted after primary ones.

2. ConfigApplyTree memoization — ConfigApplyPrimary and ConfigApplySecondary are wrapped in a
   React.memo component (ConfigApplyTree). This prevents them from remounting when WithConfig's
   parent re-renders, which would cause Property components inside composed HOCs to unmount and
   remount, corrupting the config object.

3. Children gate (null vs []) — WithConfig's `properties` state starts as `null` (not `[]`).
   Children only render after the PropertyStore debounce has flushed and delivered the initial
   config (properties !== null). This is critical for consumers like LexicalEditor that require
   a complete config on mount — rendering with partial config causes errors. After the first
   flush, `properties` is set to `[]` or a populated array, and children render.

4. stateUpdater is wrapped in useCallback to prevent unnecessary re-renders of the Properties
   component.

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

Priority Ordering

Properties support a numeric priority via PropertyPriorityProvider context. This is used by
createConfigurableComponent to ensure that primary (built-in) config properties are always added
before secondary (extension) config properties, regardless of their render order in the React tree.

- Priority 0 (default) — primary/built-in config
- Priority 1 — secondary/extension config

The priority is read by the <Property> component via usePropertyPriority() and passed to
store.addProperty() as an option. processQueue() stable-sorts operations by priority before
processing, preserving relative order within the same priority level.

Testing Notes

Because the PropertyStore uses debounce(0), tests must await the flush before asserting on onChange
results. The test utility flush() (in **tests**/utils.ts) wraps a 10ms setTimeout in act():

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
even with thousands of properties. Priority-aware sorting guarantees stable ordering between built-in
and extension configurations.

## Basic Example

```jsx
import React, { useCallback } from "react";
import { Properties, Property, toObject } from "@webiny/react-properties";

const View = () => {
  const onChange = useCallback(properties => {
    console.log(toObject(properties));
  }, []);

  return (
    <Properties onChange={onChange}>
      <Property name={"group"}>
        <Property name={"name"} value={"layout"} />
        <Property name={"label"} value={"Layout"} />
        <Property name={"toolbar"}>
          <Property name={"name"} value={"basic"} />
        </Property>
      </Property>
      <Property name={"group"}>
        <Property name={"name"} value={"heroes"} />
        <Property name={"label"} value={"Heroes"} />
        <Property name={"toolbar"}>
          <Property name={"name"} value={"heroes"} />
        </Property>
      </Property>
    </Properties>
  );
};
```

Output:

```json
{
  "group": [
    {
      "name": "layout",
      "label": "Layout",
      "toolbar": {
        "name": "basic"
      }
    },
    {
      "name": "heroes",
      "label": "Heroes",
      "toolbar": {
        "name": "heroes"
      }
    }
  ]
}
```

For more examples, check out the test files.
