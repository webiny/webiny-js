# React Dependencies - Alternatives

## react, react-dom

Status: ok
Currently 18.3.1. React 19 is available when ready to migrate.

## react-helmet

Status: replace
Unmaintained since 2020. Use `react-helmet-async` (drop-in, maintained).
https://github.com/staylor/react-helmet-async

## react-color

Status: replace
Unmaintained since 2020. Use `react-colorful` (smaller, maintained, hooks-based).
https://github.com/omgovich/react-colorful

## react-custom-scrollbars

Status: replace
Unmaintained since 2017. Use `@radix-ui/react-scroll-area` (already in deps!) or CSS `overflow: auto` with `scrollbar-gutter: stable`.

## react-butterfiles

Status: ok
Alternative: `react-dropzone` is more widely maintained.

## react-dnd, react-dnd-html5-backend, dnd-core

Status: replace
Use `@dnd-kit/core` + `@dnd-kit/sortable`. More modern, better maintained, hooks-based.
https://dndkit.com

## react-lazy-load

Status: replace
Use native `IntersectionObserver` API with a small hook.

```tsx
function useLazyLoad(ref: RefObject<Element>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true));
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return visible;
}
```

## react-transition-group

Status: replace
Use CSS transitions/animations directly or `framer-motion` for complex cases.
https://www.framer.com/motion/

## react-virtualized

Status: replace
Use `@tanstack/react-virtual` (lighter, maintained, hooks-based). `@tanstack/react-table` is already in deps.
https://tanstack.com/virtual

## react-refresh

Status: ok

## react-resizable-panels

Status: ok

## @apollo/react-common, @apollo/react-hooks, @apollo/react-components

Status: replace
Apollo v2 React bindings. Replace with `@apollo/client` v3+ (single package includes all React hooks).
https://www.apollographql.com/docs/react/migrating/apollo-client-3-migration

## @emotion/react, @emotion/styled, @emotion/css

Status: ok
Note: Tailwind CSS is also in deps. Long-term, consolidating to one styling approach reduces bundle.
`@emotion/babel-plugin` has been removed — the SWC equivalent (`@swc/plugin-emotion` in `build-tools`) is used instead.

## @lexical/react

Status: ok

## @monaco-editor/react

Status: ok

## @minoru/react-dnd-treeview

Status: replace
Depends on react-dnd. If migrating to @dnd-kit, replace this too. Consider `@dnd-kit/core` with tree utilities.

## @radix-ui/react-scroll-area

Status: ok

## @tanstack/react-table

Status: ok

## @testing-library/react, @testing-library/user-event

Status: ok

## @fortawesome/react-fontawesome

Status: ok

## @storybook/addon-a11y, @storybook/addon-docs, @storybook/addon-webpack5-compiler-babel, @storybook/react-webpack5, storybook

Status: ok

## radix-ui

Status: ok

## sonner

Status: ok

## cmdk

Status: ok

## mobx-react-lite

Status: ok

## use-deep-compare-effect

Status: ok

## is-hotkey

Status: ok

## prop-types

Status: replace
TypeScript is already used. `prop-types` is runtime overhead with no value when types are checked at compile time. Remove.

## timeago-react

Status: ok

## markdown-to-jsx

Status: ok

## reset-css

Status: reduce
Tailwind CSS (already in deps) includes a CSS reset via preflight. May be redundant.

## class-variance-authority

Status: ok

## tw-animate-css

Status: ok

## csstype

Status: ok
