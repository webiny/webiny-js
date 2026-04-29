# Layout builders — same pattern as field builders

## Context

Fields use builders with internal config + `.build()`. Layouts should work the same way. Currently layout factories return `LayoutNode[]` (data nodes), some with ad-hoc methods bolted on (`IRowNodeHandle`, `ITabsBuilder`). Unify under one pattern: layout factories return builders, FormModel calls `.build()` on each.

## Design

```ts
// Field pattern (existing)
config.fields = (fields) => ({
    title: fields.text().label("Title").build("title")  // wait, .build() is called by FormModel
})

// Layout pattern (new) — mirrors fields
config.layout = (layout) => [
    layout.row("title", "path"),
    layout.separator(),
    layout.tabs("settings")
        .renderer("tabs-vertical")
        .tab({ id: "general", label: "General", layout: l => [...] })
        .rules([...]),
    layout.object("page", l => [...])
]
```

The layout factory returns `ILayoutNodeBuilder[]`. FormModel calls `.build()` on each to get `LayoutNode[]`.

## Types

```ts
interface ILayoutNodeBuilder {
    build(): LayoutNode;
}

interface IRowBuilder extends ILayoutNodeBuilder {
    before(target: string): this;
    after(target: string): this;
    build(): IRowNode;
}

interface ISeparatorBuilder extends ILayoutNodeBuilder {
    build(): ISeparatorNode;
}

interface ITabsBuilder extends ILayoutNodeBuilder {
    renderer<TName extends LayoutRendererName>(name, ...args): this;
    tab(definition: ITabDefinitionInput): this;
    rules(rules: IRule[]): this;
    build(): ITabsNode;
}

interface IElementBuilder extends ILayoutNodeBuilder {
    build(): IElementNode;
}

interface IObjectBuilder extends ILayoutNodeBuilder {
    build(): IObjectNode;
}
```

Data nodes (`IRowNode`, `ITabsNode`, etc.) stay pure data — no methods. The `LayoutNode` union stays clean.

`ILayoutBuilder` returns builders:
```ts
interface ILayoutBuilder {
    row(...fieldIds: string[]): IRowBuilder;
    separator(): ISeparatorBuilder;
    tabs(id?: string): ITabsBuilder;
    element(renderer: string, props?: Record<string, unknown>): IElementBuilder;
    object(fieldName: string, layout: (l: ILayoutBuilder) => ILayoutNodeBuilder[]): IObjectBuilder;
}
```

`IFormModelConfig.layout` returns builders:
```ts
layout?: (layout: ILayoutBuilder) => ILayoutNodeBuilder[];
```

## Build step

In `FormModel` constructor and wherever layouts are resolved:
```ts
const builders = config.layout(layoutBuilder);
this._layout = builders.map(b => b.build());
```

Same for tab definition inputs — their `layout` callback returns builders:
```ts
interface ITabDefinitionInput {
    id: string;
    label: string;
    layout: (layout: ILayoutBuilder) => ILayoutNodeBuilder[];
    // ...
}
```

And `ITabsBuilder.tab()` calls `.build()` on each child builder when building the tab node.

## Cleanup

- Remove `IRowNodeHandle` — replaced by `IRowBuilder`
- Remove `ITabsBuilder` from `LayoutNode` union — builders are separate from nodes
- `LayoutNode` goes back to pure data: `IRowNode | ISeparatorNode | ITabsNode | IElementNode | IObjectNode`
- `IRowNode.position` stays (set by `IRowBuilder.before()/after()`, baked into the built node)

## `ILayoutModifier`

The modifier returns positioned builders (same as before, but now with `ILayoutNodeBuilder` + position):
```ts
interface ILayoutModifier {
    row(...fieldIds: string[]): IRowBuilder & IPositionedLayoutNode;
    separator(): ISeparatorBuilder & IPositionedLayoutNode;
    tabs(id?: string): ITabsBuilder & IPositionedLayoutNode;
    // ...
}
```

Actually simpler: `IRowBuilder` already has `.before()/.after()` which sets position. The modifier just returns the same builders. FormModel applies positioning after building.

## Files to modify

- `abstractions.ts` — new builder interfaces, update `ILayoutBuilder`, `IFormModelConfig`, `ITabDefinitionInput`, clean up `LayoutNode`
- `FormModel.ts` — builder implementations, `.build()` calls in constructor/layout resolution
- `FormView.tsx` — no change (reads from `LayoutNodeVM`, not `LayoutNode`)
- All layout callers — no change needed (they already return builder chains from `layout.row()/.tabs()` etc.)
- Test files — no change (same API from the caller's perspective)

## Verification

1. `yarn build -p @webiny/app-admin -p @webiny/app-website-builder 2>&1 | tail -30`
2. `yarn test packages/app-admin 2>&1 | tail -50`
