import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { runBundle } from "./runBundle.js";
import { ManifestBuildError } from "./ManifestBuildError.js";
import { loadSdkStub } from "./sdkStub.js";
import type { SdkStub } from "./sdkStub.js";
import { SDK_FACTORY_NAMES } from "./sdkFactoryNames.js";

/** Enough for module-level declarations, far short of anything that loops. */
const EVALUATION_TIMEOUT_MS = 1000;

/** Marks a factory call recorded inside the context, for the host to replay. */
const FACTORY_KEY = "__webinyInputFactory";

/*
 * Runs inside the context, after the bundle. The runtime it hands `createComponent` is built there:
 * each input factory records its name and params, `onChange` functions become source text the way
 * `createInput` serializes them, and the result leaves the context as a JSON string. React is a stub,
 * since the component function is never called.
 */
const EXTRACT_MANIFEST = `(() => {
    const record = name => params => {
        const recorded = Object.assign({}, params);
        if (typeof recorded.onChange === "function") {
            recorded.onChange = recorded.onChange.toString();
        }
        return { ${FACTORY_KEY}: name, params: recorded };
    };
    const sdk = { createComponent: (component, manifest) => ({ manifest }) };
    for (const name of ${JSON.stringify(SDK_FACTORY_NAMES)}) {
        sdk[name] = record(name);
    }
    const React = { createElement: () => null, Fragment: null };
    const built = __remoteComponent__.createComponent({
        version: "1",
        dependencies: { sdk, React },
        environment: { tenantId: "root", locale: "en-US", mode: "server" }
    });
    return built && built.manifest ? JSON.stringify(built.manifest) : null;
})()`;

/** Replays the recorded factory calls with the real factories, innermost first, as a bundle runs them. */
function replayFactories(value: unknown, sdk: SdkStub): unknown {
    if (Array.isArray(value)) {
        return value.map(item => replayFactories(item, sdk));
    }
    if (!value || typeof value !== "object") {
        return value;
    }

    const record = value as Record<string, unknown>;
    const factoryName = record[FACTORY_KEY];
    if (typeof factoryName === "string") {
        const factory = sdk[factoryName];
        if (!factory) {
            throw new Error(`Unknown input factory "${factoryName}".`);
        }
        const params = replayFactories(record.params, sdk);
        return factory(params);
    }

    const entries = Object.entries(record).map(([key, item]) => [key, replayFactories(item, sdk)]);
    return Object.fromEntries(entries);
}

/**
 * Builds a component's manifest from its own bundle, by running the bundle's `createComponent` with a
 * stub runtime and keeping the manifest it hands back.
 *
 * Evaluating the manifest expression on its own would be wrong: a manifest may reference names
 * declared at module scope (`defaultValue: BODY_DEFAULT`), which are only in scope inside the bundle.
 *
 * Everything the bundle runs, its module-level code included, runs inside the context under the
 * timeout. No host object enters the context and only a JSON string leaves it; the input factories
 * run on the host afterwards, on that data. The result is plain JSON data, as `bundleComponent`
 * serializes it.
 */
export async function buildComponentManifest(
    bundled: string,
    componentName: string
): Promise<ComponentManifest> {
    const sdk = await loadSdkStub();
    let manifest: Record<string, unknown>;

    try {
        const serialized = runBundle(bundled, EXTRACT_MANIFEST, {}, EVALUATION_TIMEOUT_MS);
        if (typeof serialized !== "string") {
            throw new Error("The bundle produced no manifest.");
        }

        const recorded: unknown = JSON.parse(serialized);
        if (!recorded || typeof recorded !== "object" || Array.isArray(recorded)) {
            throw new Error("The bundle produced no manifest.");
        }

        manifest = replayFactories(recorded, sdk) as Record<string, unknown>;
    } catch (error) {
        throw new ManifestBuildError(componentName, error);
    }

    const tags = Array.isArray(manifest.tags) ? manifest.tags : [];

    // The stored component's name is what page elements record, so the manifest carries it.
    const named = { ...manifest, name: componentName, tags };
    const json = JSON.stringify(named);
    const result: ComponentManifest = JSON.parse(json);

    return result;
}
