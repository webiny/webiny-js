/*
 * Its own module so components inside this package can import it without going through the
 * package barrel, which risks an import cycle. `index.ts` re-exports it for everyone else.
 */
export { observer as createReactiveComponent } from "mobx-react-lite";
