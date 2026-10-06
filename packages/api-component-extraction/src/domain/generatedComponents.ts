import { createHash } from "node:crypto";
import { Result } from "@webiny/feature/api";
import type { StageArtifactStore } from "./stage.js";
import type { GenerateArtifact, GeneratedComponent, GeneratedComponentRef } from "./artifacts.js";
import type { ExtractionError } from "./errors.js";

/**
 * The one place that knows a Generate aggregate can hold either shape.
 *
 * Artifacts written before the aggregate started referencing carry each `GeneratedComponent` inline;
 * new ones carry a `resultRef`. Eight consumers read this artifact, and having each of them branch on
 * `"resultRef" in entry ? fetch : use inline` would be the same defect this project has already
 * shipped four times: two paths answering one question with only one of them exercised. So the branch
 * lives here, once, and consumers call a function.
 *
 * The split between `componentsMetadata` and `readComponents` is the other half of it. A consumer that
 * needs only names and validator results must not pull every component's source to render a list, and
 * the way to guarantee that is to hand it a type that has no source on it rather than to remember.
 */

/** The per-component artifact `generateResultKey` addresses. */
export interface ComponentResultArtifact {
    signature: string;
    component: GeneratedComponent | null;
    /** Bumped on every write; see `GeneratedComponentRef.revision`. */
    revision: number;
    /**
     * Why no generation was attempted, when none was — set only for a component skipped before any
     * model call (no usable reference crop). A component whose attempts all failed leaves it unset.
     */
    notGenerated?: string;
}

type Entry = GeneratedComponentRef | GeneratedComponent;

const isRef = (entry: Entry): entry is GeneratedComponentRef =>
    typeof (entry as GeneratedComponentRef).resultRef === "string";

/**
 * Content identity for a generated component. Covers everything a consumer downstream of Generate
 * reads, so a change to any of it is a material change; excludes `attempts`, which counts how the
 * component was arrived at rather than what it is.
 */
export const componentContentSha256 = (component: GeneratedComponent): string =>
    createHash("sha256")
        .update(
            JSON.stringify([
                component.source,
                component.css,
                component.props,
                component.members,
                component.tokenBindings,
                component.validation
            ])
        )
        .digest("hex");

/** Builds the aggregate entry for a component whose result artifact lives at `resultRef`. */
export const toComponentRef = (
    component: GeneratedComponent,
    resultRef: string,
    revision: number
): GeneratedComponentRef => ({
    signature: component.signature,
    name: component.name,
    type: component.type,
    attempts: component.attempts,
    memberCount: component.members.length,
    pageCount: new Set(component.members.map(member => member.url)).size,
    propCount: component.props.length,
    validation: component.validation,
    resultRef,
    revision,
    contentSha256: componentContentSha256(component)
});

/**
 * The metadata every consumer can have for free, from either shape, without a single fetch.
 *
 * Returns `GeneratedComponentRef`, so a caller that only needs this cannot reach `source` even by
 * accident — the field is not on the type. An older inline artifact is projected into the same shape,
 * with a ref that points nowhere because there is nothing to point at.
 */
export const componentsMetadata = (artifact: GenerateArtifact): GeneratedComponentRef[] =>
    (artifact.components as Entry[]).map(entry =>
        isRef(entry) ? entry : toComponentRef(entry, "", 0)
    );

/**
 * Resolves one entry to a whole component, fetching only when the entry is a reference.
 *
 * A missing referenced artifact is an error rather than a null: the aggregate said the component is
 * there, so its absence is corruption, and a consumer that silently skipped it would promote or
 * assemble a run with components quietly missing.
 */
export const readComponent = async (
    store: StageArtifactStore.Interface,
    entry: Entry
): Promise<Result<GeneratedComponent, ExtractionError>> => {
    if (!isRef(entry)) {
        return Result.ok(entry);
    }

    const result = await store.getJson<ComponentResultArtifact>(entry.resultRef);

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const component = result.value?.component;

    if (!component) {
        return Result.fail(
            new Error(
                `The component artifact for "${entry.name}" (${entry.signature}) is missing at ${entry.resultRef}.`
            ) as ExtractionError
        );
    }

    return Result.ok(component);
};

/**
 * Resolves every entry. For a referencing artifact this is N reads of small items, which is the point
 * of the split — the alternative was one item that cannot grow past a dozen components.
 */
export const readComponents = async (
    store: StageArtifactStore.Interface,
    artifact: GenerateArtifact
): Promise<Result<GeneratedComponent[], ExtractionError>> => {
    const components: GeneratedComponent[] = [];

    for (const entry of artifact.components as Entry[]) {
        const resolved = await readComponent(store, entry);

        if (resolved.isFail()) {
            return Result.fail(resolved.error);
        }

        components.push(resolved.value);
    }

    return Result.ok(components);
};
