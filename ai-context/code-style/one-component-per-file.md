# One React Component Per File

A file holds one React component. Name the file after it. Another component goes in its own file,
even when only the first one uses it.

```tsx
// Good: AddWidgetDrawer.tsx
export const AddWidgetDrawer = (props: AddWidgetDrawerProps) => {
  /* ... */
  return <WidgetList items={items} />;
};

// WidgetList.tsx
export const WidgetList = ({ items }: WidgetListProps) => {
  /* ... */
};
```

```tsx
// Bad: AddWidgetDrawer.tsx
export const AddWidgetDrawer = (props: AddWidgetDrawerProps) => {
  /* ... */
};

// Unexported, but it has its own props, state and layout: move it to WidgetList.tsx.
const WidgetList = ({ items, onSearch }: WidgetListProps) => {
  const [query, setQuery] = useState("");
  /* ... 60 lines ... */
};
```

Being unexported doesn't make it a helper. A second component that has its own props interface,
calls hooks, or runs to more than a handful of lines is a component, and it gets a file.
[one-public-function-per-file.md](./one-public-function-per-file.md) still allows unexported
helpers next to their user; that covers plain functions, not components.

## Exception: a tiny presentational piece

A small piece of markup that only the component in this file renders may stay: no hooks, no state,
no props interface of its own beyond a value or two, and short enough to read at a glance (around
20 lines). A drawn thumbnail or an icon wrapper is fine. If it grows past that, move it out.

```tsx
// Good: kept beside its only user.
const WidgetThumbnail = ({ added }: { added: boolean }) => (
  <div aria-hidden className={cn("h-[58px] w-[84px] rounded-sm", added && "opacity-60")} />
);
```

Group the files for one feature in a folder, so splitting a component up doesn't scatter it.
