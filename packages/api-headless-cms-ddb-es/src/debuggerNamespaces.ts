/**
 * Claims the `cms.` debug namespace prefix.
 *
 * The module specifier has to be exactly this one - augmenting a relative path would silently do
 * nothing.
 */
declare module "@webiny/api-core/features/debugger/abstractions.js" {
    interface DebugNamespaces {
        cms: `cms.${string}`;
    }
}

export {};
