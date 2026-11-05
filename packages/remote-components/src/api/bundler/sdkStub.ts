import { SDK_FACTORY_NAMES } from "./sdkFactoryNames.js";

/**
 * The real input factories, plus a `createComponent` that hands back what it was given. Host
 * functions: `buildComponentManifest` replays recorded calls with them outside the context, and only
 * `renderComponentMarkup` hands them to a bundle.
 */
export interface SdkStub {
    createComponent: (component: unknown, manifest: unknown) => unknown;
    [factory: string]: (...args: any[]) => unknown;
}

let loading: Promise<SdkStub> | undefined;

/*
 * `@webiny/website-builder-sdk` is imported lazily: it has no `sideEffects: false`, so a static
 * import puts the whole SDK into every API bundle that includes this package, and only bundling and
 * bundle validation need it.
 */
async function createSdkStub(): Promise<SdkStub> {
    const sdk = await import("@webiny/website-builder-sdk");

    const stub: SdkStub = {
        createComponent: (component: unknown, manifest: unknown) => ({ component, manifest })
    };
    for (const name of SDK_FACTORY_NAMES) {
        stub[name] = sdk[name] as SdkStub[string];
    }
    return stub;
}

/** Loaded once per process, on first use. */
export function loadSdkStub(): Promise<SdkStub> {
    if (!loading) {
        loading = createSdkStub();
    }
    return loading;
}
