# Sibling Field References in Condition Rules

## Context

Condition rules on child fields inside an ObjectField can only target root-level fields. A rule like `{ target: "name", operator: "neq", value: "pro", action: "disable" }` on a child field `tier` inside object `metaTags` fails because `form.field("name")` looks up the root field map, not siblings.

Two capabilities are needed:

1. **Dot-notation with list indices** — `metaTags.0.name` to reference a specific item's child from anywhere
2. **Relative sibling references** — `$self.name` to reference a sibling field within the same parent object/item, so rules work regardless of nesting depth or list index

## Design

### 1. Dot-notation with numeric indices

`FormModel.field()` already splits on `.` and traverses `ObjectField.getChild()`. Extend this to handle numeric segments by looking up list items.

In `ObjectField`, add `getItemChild(index, name)` or make `getChild` handle numeric strings:

```typescript
getChild(name: string): IField | undefined {
    const index = parseInt(name, 10);
    if (!isNaN(index)) {
        const item = this._items[index];
        return item ? item.children.get(/* next segment */) : undefined;
    }
    return this._children.get(name);
}
```

Problem: `getChild("0")` returns the item scope, but the next segment needs to resolve within that item's children. The current loop in `FormModel.field()` calls `getChild(parts[i])` one segment at a time. If segment is `"0"`, we need to return something that the next iteration can call `getChild` on.

**Solution**: Return a lightweight proxy/wrapper from `getChild("0")` that represents the item scope, OR handle numeric indices directly in the `FormModel.field()` traversal loop by checking `isObjectField` and using `items[index].children`:

```typescript
// In FormModel.field() traversal loop:
for (let i = 1; i < parts.length && current; i++) {
  if (isObjectField(current)) {
    const index = parseInt(parts[i], 10);
    if (!isNaN(index) && current.isList) {
      const item = current.items[index];
      if (!item || i + 1 >= parts.length) {
        current = undefined;
      } else {
        i++; // consume the index segment
        current = item.children.get(parts[i]);
      }
    } else {
      current = current.getChild(parts[i]);
    }
  } else {
    current = undefined;
  }
}
```

### 2. Relative sibling references (`$self.fieldName`)

The rule evaluator needs to know the calling field's parent context to resolve relative paths. Currently `IRuleEvaluator.evaluate(rule, form)` is stateless.

**Approach**: Pre-process `$self.xxx` targets in `Field._evaluateRules()` before passing to `form.evaluateRules()`. The field knows its `qualifiedName` (e.g., `metaTags.0.tier`), so it can resolve `$self.name` → `metaTags.0.name` by replacing `$self` with its parent path.

This keeps the `IRuleEvaluator` interface unchanged — the resolution happens before rules reach the evaluator.

```typescript
// In Field._evaluateRules():
private _evaluateRules(): { visible: boolean; disabled: boolean } {
    if (!this._form) {
        return { visible: true, disabled: false };
    }
    const own = this.config.rules ?? [];
    const all = [...this._ancestorRules, ...own];
    if (all.length === 0) {
        return { visible: true, disabled: false };
    }
    const resolved = this._resolveRelativeTargets(all);
    return this._form.evaluateRules(resolved);
}

private _resolveRelativeTargets(rules: IRule[]): IRule[] {
    const parentPath = this._getParentPath();
    if (!parentPath) {
        return rules;
    }
    let needsResolve = false;
    for (const rule of rules) {
        if (rule.target.startsWith("$self.")) {
            needsResolve = true;
            break;
        }
    }
    if (!needsResolve) {
        return rules;
    }
    return rules.map(rule => {
        if (rule.target.startsWith("$self.")) {
            return { ...rule, target: `${parentPath}.${rule.target.slice(6)}` };
        }
        return rule;
    });
}

private _getParentPath(): string | null {
    const qn = this._qualifiedName;
    const lastDot = qn.lastIndexOf(".");
    return lastDot > 0 ? qn.substring(0, lastDot) : null;
}
```

With this, a rule `{ target: "$self.name", ... }` on field `metaTags.0.tier` (qualifiedName = `metaTags.0.tier`) resolves to `{ target: "metaTags.0.name", ... }` — then `form.field("metaTags.0.name")` traverses the dot-notation path including the numeric index.

Same logic applies in `ObjectField._evaluateRules()` which delegates to `_base._evaluateRules()` — since `_base` has the correct `qualifiedName`, it works automatically.

## Changes

### `FormModel.ts`

Update `field()` method's dot-notation traversal to handle numeric indices for list items:

```typescript
field(name: string): IField {
    const field = this._fields.get(name);
    if (field) {
        return field;
    }

    const parts = name.split(".");
    if (parts.length > 1) {
        let current: IField | undefined = this._fields.get(parts[0]);
        for (let i = 1; i < parts.length && current; i++) {
            if (isObjectField(current)) {
                const index = parseInt(parts[i], 10);
                if (!isNaN(index) && current.isList) {
                    const item = current.items[index];
                    if (!item || i + 1 >= parts.length) {
                        current = undefined;
                    } else {
                        i++;
                        current = item.children.get(parts[i]);
                    }
                } else {
                    current = current.getChild(parts[i]);
                }
            } else {
                current = undefined;
            }
        }
        if (current) {
            return current;
        }
    }

    throw new Error(`Field "${name}" not found.`);
}
```

### `Field.ts`

Add `_resolveRelativeTargets()` and `_getParentPath()` private methods. Update `_evaluateRules()` to call `_resolveRelativeTargets()` before delegating to `form.evaluateRules()`.

### `abstractions.ts`

Add `isList` and `items` to `IObjectField` interface if not already exposed (needed by `FormModel.field()` traversal). Check existing interface.

### Tests (`FormModel.test.ts` or `Rules.test.ts`)

```
describe("dot-notation field access with list indices", () => {
    - form.field("obj.child") works for non-list object
    - form.field("list.0.child") works for list item children
    - form.field("list.1.child") works for second item
    - form.field("list.99.child") throws for out-of-bounds
});

describe("$self relative rule targets", () => {
    - $self.sibling resolves to sibling within same object
    - $self.sibling resolves correctly within list items (different indices)
    - $self.sibling works with hide action
    - $self.sibling works with disable action
    - non-$self targets still resolve from root
    - $self on root field (no parent) falls through gracefully
});
```

## Key Files

- `packages/app-admin/src/features/formModel/FormModel.ts` — `field()` numeric index traversal
- `packages/app-admin/src/features/formModel/Field.ts` — `$self` resolution in `_evaluateRules()`
- `packages/app-admin/src/features/formModel/abstractions.ts` — verify `IObjectField` exposes `isList`/`items`
- `packages/app-admin/src/features/formModel/Rules.test.ts` — tests

## Verification

1. `yarn build -p @webiny/app-admin 2>&1 | tail -15`
2. `yarn test packages/app-admin/src/features/formModel 2>&1 | tail -50`
3. Manual: demo meta tags with `$self.name` rule → tier dropdown disabled/enabled based on sibling name value
