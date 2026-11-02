/**
 * The `sdk` a bundle's `createComponent` gets when the API evaluates it. The input factories are pure
 * data functions with no React dependency, so the real ones are used; `createComponent` hands back
 * what it was given, which is how the component and its manifest come out of the bundle.
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

    return {
        createComponent: (component: unknown, manifest: unknown) => ({ component, manifest }),
        createBooleanInput: sdk.createBooleanInput,
        createColorInput: sdk.createColorInput,
        createContentEntryInput: sdk.createContentEntryInput,
        createDateInput: sdk.createDateInput,
        createFileInput: sdk.createFileInput,
        createInput: sdk.createInput,
        createLexicalInput: sdk.createLexicalInput,
        createLongTextInput: sdk.createLongTextInput,
        createNumberInput: sdk.createNumberInput,
        createObjectInput: sdk.createObjectInput,
        createRadioInput: sdk.createRadioInput,
        createSelectInput: sdk.createSelectInput,
        createSlotInput: sdk.createSlotInput,
        createTagsInput: sdk.createTagsInput,
        createTextInput: sdk.createTextInput
    };
}

/** Loaded once per process, on first use. */
export function loadSdkStub(): Promise<SdkStub> {
    if (!loading) {
        loading = createSdkStub();
    }
    return loading;
}
