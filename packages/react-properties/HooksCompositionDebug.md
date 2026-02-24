Here's my summary for you:

  ---
Root cause: The PropertyStore's debounce(fn, 0) breaks React 18's automatic state batching.

In the old code, Property effects called setProperties (React state) and Compose effects called
setComponents (React state). React 18 batches both state updates from the same commit phase into a
single re-render. Main sees both changes atomically.

In the new code, Property effects queue operations into PropertyStore with a debounced flush
(setTimeout(0)). Compose effects still call setComponents synchronously. React processes setComponents
alone → Main re-renders → useContentEntry() resolves to the decorated hook chain (with different hooks)
→ hook order violation.

The problematic area isn't in app-headless-cms specifically — it's any place where:
1. A decoratable hook (useContentEntry) has decorators registered via <Compose> in a Config component
2. The hook is called by a component (Main) that renders in the same tree
3. The decorator registration (Compose effect → setComponents) and property registration (Property
   effect → debounced) happen in different microtask cycles

The fix should be in PropertyStore or Properties — we need to ensure that Property effect callbacks
trigger a synchronous state update (like the old setProperties did) so React can batch it with
setComponents from Compose effects.

One approach: instead of debouncing in PropertyStore, have addProperty/removeProperty call the onChange
callback directly (synchronously), so React batches it with other state updates in the same commit
phase. The store still benefits from the stable context (no unnecessary re-renders from
PropertiesContext value changes), but the notification to WithConfig's setProperties happens
synchronously.

Would you like me to implement this fix — making the store operations synchronous while keeping the
stable context architecture?
