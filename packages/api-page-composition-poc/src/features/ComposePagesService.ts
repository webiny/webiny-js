import { Result } from "@webiny/feature/api";
import { RunRepository } from "@webiny/api-component-extraction/domain/abstractions.js";
import { BlobStore, StageArtifactStore } from "@webiny/api-component-extraction/domain/stage.js";
import { stageEntry } from "@webiny/api-component-extraction/domain/ledger.js";
import { stageArtifactKey } from "@webiny/api-component-extraction/constants.js";
import { readComponents } from "@webiny/api-component-extraction/domain/generatedComponents.js";
import { normalizeUrl } from "@webiny/api-component-extraction/domain/overrides.js";
import { findNodeByBox } from "@webiny/api-component-extraction/features/stages/cluster/sectionNode.js";
import type {
    AssembleArtifact,
    AssembledPage,
    Box,
    CapturedNode,
    ComponentInstance,
    GenerateArtifact,
    GeneratedComponent,
    PromoteArtifact,
    SegmentArtifact,
    SegmentedPage
} from "@webiny/api-component-extraction/domain/artifacts.js";
import type { Run } from "@webiny/api-component-extraction/domain/types.js";
import { GetRemoteComponentUseCase } from "@webiny/remote-components/api/features/getComponent/abstractions.js";
import { CreatePageUseCase } from "@webiny/api-website-builder/features/pages/CreatePage/abstractions.js";
import { PublishPageUseCase } from "@webiny/api-website-builder/features/pages/PublishPage/abstractions.js";
import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/abstractions.js";
import { ROOT_FOLDER } from "@webiny/api-website-builder/constants.js";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { ComposePagesService as Abstraction, PageMapStore } from "~/domain/abstractions.js";
import { PageCompositionError } from "~/domain/errors.js";
import type {
    ComposePagesResult,
    DiscardEntry,
    PageMapEntry,
    PageMapFailure,
    PageSignals,
    UnplacedInstance
} from "~/domain/types.js";
import { validateTextPreservation } from "@webiny/api-component-extraction/features/shared/validators.js";
import { buildPageDocument, type ComponentPlacement } from "~/pages/buildPageDocument.js";
import { collectSectionTexts } from "~/pages/collectSectionTexts.js";
import { deriveInstanceProps } from "~/pages/deriveInstanceProps.js";
import { deriveCompositeInputs } from "~/pages/deriveCompositeInputs.js";
import { applyFormPreview } from "~/pages/applyFormPreview.js";
import { stripInventedBindings, type ElementContext } from "~/pages/stripInventedBindings.js";
import {
    recoverInventedDestinations,
    type PlacedInvention
} from "~/pages/recoverInventedDestinations.js";
import { collectImages, collectLinks } from "~/pages/harvest.js";
import {
    rewriteDestinations,
    tally,
    type DestinationOutcome
} from "~/pages/rewriteDestinations.js";
import { toPageIdentity } from "~/pages/toPageIdentity.js";
import { scalarInputNames } from "~/pages/scalarInputNames.js";
import { fileInputShapes, type FileInputShape } from "~/pages/fileInputShape.js";
import {
    rewriteImageSources,
    tallyImageSources,
    type ImageSourceOutcome
} from "~/pages/rewriteImageSources.js";
import { AssetUrlResolver } from "~/features/AssetUrlResolver.js";

/** How many of a page's missing text runs to keep. Enough to see the shape of the loss, not a log. */
const MISSING_TEXT_SAMPLE = 12;

/** A page created but not yet published, held until every page exists and links can be rewritten. */
interface CreatedPage {
    entry: PageMapEntry;
    bindings: Record<string, any>;
    /** Destinations the model invented on this page, emptied before it was built. */
    invented: PlacedInvention[];
    /** Images the model invented on this page, emptied rather than rendered. */
    inventedImages: PlacedInvention[];
    /** What happened to each image binding: repointed at File Manager, or left on its origin. */
    imageSources: ImageSourceOutcome[];
    /** What composing this page covered and what it left behind — see `PageSignals`. */
    coverage: PageCoverage;
}

/**
 * The half of a page's signals that only `composePage` can see: how many sections the source had,
 * how many instances were asked for, which of them found no component, and the page's own text.
 *
 * Gathered here rather than recomputed later because the section nodes are already resolved and the
 * trees already in memory at this point; reading them again afterwards would be a second walk over
 * the same S3 blobs for numbers we have in hand.
 */
interface PageCoverage {
    sourceSections: number;
    assembledInstances: number;
    composedInstances: number;
    unplaced: UnplacedInstance[];
    /** Every text run of every section that was placed, for the coverage check against the page. */
    sourceTexts: string[];
}

/** What a promoted component needs to be placed: its final name, and the manifest for its inputs. */
interface PlaceableComponent {
    manifest: ComponentManifest;
    /** Classify's type for this cluster, so a form can be made visibly inert. */
    type: string;
    /** Manifest inputs a derived scalar may be bound to — see `scalarInputNames`. */
    scalarInputs: Set<string>;
    /** How this component reads each of its file inputs — see `fileInputShape`. */
    fileShapes: ReadonlyMap<string, FileInputShape>;
    props: GeneratedComponent["props"];
    /** Text runs of the cluster's reference member, for per-instance alignment. */
    representativeTexts: string[];
}

/** The host the run crawled, taken from the pages themselves rather than configured twice. */
const hostOf = (url: string): string => {
    try {
        return new URL(url).host;
    } catch {
        return "";
    }
};

/** Every url a page's file-typed bindings point at, for priming the asset map in one pass. */
const imageUrlsIn = (bindings: Record<string, any>): string[] => {
    const urls: string[] = [];
    for (const element of Object.values(bindings)) {
        for (const binding of Object.values(element?.inputs ?? {})) {
            const entry = binding as { type?: unknown; static?: unknown };
            if (entry?.type !== "file") {
                continue;
            }
            const value = entry.static;
            const url =
                typeof value === "string"
                    ? value
                    : ((value as { url?: unknown; src?: unknown })?.url ??
                      (value as { src?: unknown })?.src);
            if (typeof url === "string" && url.trim()) {
                urls.push(url);
            }
        }
    }
    return urls;
};

class ComposePagesServiceImpl implements Abstraction.Interface {
    constructor(
        private runs: RunRepository.Interface,
        private artifacts: StageArtifactStore.Interface,
        private blobs: BlobStore.Interface,
        private createPage: CreatePageUseCase.Interface,
        private publishPage: PublishPageUseCase.Interface,
        private updatePage: UpdatePageUseCase.Interface,
        private pageMaps: PageMapStore.Interface,
        private getComponent: GetRemoteComponentUseCase.Interface,
        private assetUrls: AssetUrlResolver.Interface
    ) {}

    async execute(runId: string): Promise<Result<ComposePagesResult, PageCompositionError>> {
        const runResult = await this.runs.get(runId);
        if (runResult.isFail()) {
            return Result.fail(new PageCompositionError(`Run ${runId} could not be read.`));
        }
        const run = runResult.value;

        const assemble = await this.readArtifact<AssembleArtifact>(run, "assemble", "assembly");
        if (assemble.isFail()) {
            return Result.fail(assemble.error);
        }
        const promote = await this.readArtifact<PromoteArtifact>(run, "promote", "promotion");
        if (promote.isFail()) {
            return Result.fail(promote.error);
        }
        const generate = await this.readArtifact<GenerateArtifact>(run, "generate", "components");
        if (generate.isFail()) {
            return Result.fail(generate.error);
        }
        const segment = await this.readArtifact<SegmentArtifact>(run, "segment", "sections");
        if (segment.isFail()) {
            return Result.fail(segment.error);
        }

        const segmentByUrl = new Map(segment.value.pages.map(page => [page.url, page]));
        const trees = new Map<string, CapturedNode>();

        const placeable = await this.resolveComponents({
            promote: promote.value,
            generate: generate.value,
            segmentByUrl,
            trees
        });

        const created: CreatedPage[] = [];
        const failed: PageMapFailure[] = [];

        for (const page of assemble.value.pages) {
            const outcome = await this.composePage({ page, placeable, segmentByUrl, trees });
            if (outcome.isFail()) {
                failed.push({ sourceUrl: page.url, reason: outcome.error.message });
                continue;
            }
            created.push(outcome.value);
        }

        /*
         * Only pages that actually exist count as migrated. Deriving the set from the assembled list
         * instead would rewrite a link to a page whose creation failed, turning a working absolute
         * URL into a relative one that 404s — the exact inversion of the point.
         */
        const migratedPaths = new Set(created.map(page => page.entry.path));
        const sourceHost = hostOf(assemble.value.pages[0]?.url ?? "");

        const outcomes: DestinationOutcome[] = [];
        const discarded: DiscardEntry[] = [];
        const recovered: { from: string; to: string }[] = [];

        for (const page of created) {
            const rewrite = rewriteDestinations({
                bindings: page.bindings,
                migratedPaths,
                sourceHost
            });
            outcomes.push(...rewrite.outcomes);

            for (const outcome of rewrite.outcomes) {
                if (outcome.kind === "unmigrated") {
                    discarded.push({
                        kind: "link.unmigrated",
                        page: page.entry.path,
                        sourceUrl: page.entry.sourceUrl,
                        detail: `${outcome.href} left absolute: that page is not in this migration`
                    });
                }
            }

            /*
             * After rewriting, never before: writing a migrated path in first would let the
             * rewriting pass count a recovered destination as one it rewrote, and keeping those two
             * numbers apart is the whole point of measuring them.
             */
            const recovery = recoverInventedDestinations({
                bindings: rewrite.bindings,
                invented: page.invented,
                migratedPaths
            });
            recovered.push(...recovery.recovered);

            /*
             * An invented image is recorded and left empty, never recovered. A destination can be
             * recovered because a plausible path may still name a real migrated page; there is no
             * equivalent for a photograph — nothing on this site can stand in for one, and
             * substituting anything would put a picture of somewhere else on the customer's page.
             */
            for (const item of page.imageSources) {
                if (item.kind !== "unmigrated") {
                    continue;
                }
                discarded.push({
                    kind: "image.unmigrated",
                    page: page.entry.path,
                    sourceUrl: page.entry.sourceUrl,
                    detail: `${item.url} left on its original host at ${item.path}: this migration has no copy of it`
                });
            }

            for (const item of page.inventedImages) {
                discarded.push({
                    kind: "image.invented",
                    page: page.entry.path,
                    sourceUrl: page.entry.sourceUrl,
                    detail: `${item.value} left empty at ${item.path}: the section never showed that image`
                });
            }

            for (const item of recovery.unrecovered) {
                discarded.push({
                    kind: "link.invented",
                    page: page.entry.path,
                    sourceUrl: page.entry.sourceUrl,
                    detail:
                        item.reason === "ambiguous"
                            ? `${item.value} left empty at ${item.path}: more than one migrated page ends there`
                            : `${item.value} left empty at ${item.path}: the page never linked there`
                });
            }

            /*
             * This page's own signals, recorded from the pass that is already running rather than
             * recomputed later. `tally` produces the run totals from the same outcomes below, so the
             * per-page and run-level numbers come from one source and cannot disagree.
             *
             * The text check reuses W5's `validateTextPreservation` — the same containment rule the
             * Generate stage applies to a component's source, pointed at the composed page's bindings
             * instead. Its failures are the source runs the page does not carry, so the count of them
             * is the coverage shortfall; a second implementation would be a second answer.
             */
            const pageCounts = tally(rewrite.outcomes);
            const text = validateTextPreservation(
                page.coverage.sourceTexts,
                JSON.stringify(recovery.bindings)
            );
            page.entry.signals = {
                sourceSections: page.coverage.sourceSections,
                assembledInstances: page.coverage.assembledInstances,
                composedInstances: page.coverage.composedInstances,
                unplaced: page.coverage.unplaced,
                textTotal: page.coverage.sourceTexts.length,
                textPresent: page.coverage.sourceTexts.length - text.failures.length,
                textMissingSample: text.failures
                    .slice(0, MISSING_TEXT_SAMPLE)
                    .map(failure => failure.replace(/^missing text: /, "")),
                links: {
                    before: pageCounts.destinations,
                    after: pageCounts.destinations,
                    rewritten: pageCounts.rewritten,
                    external: pageCounts.external,
                    unmigrated: pageCounts.unmigrated,
                    dropped: page.invented.length,
                    recovered: recovery.recovered.length
                },
                // Beside the links rather than anywhere else: the same question about a different
                // kind of reference, so it reads the same way in the report.
                images: {
                    ...tallyImageSources(page.imageSources),
                    dropped: page.inventedImages.length
                }
            } satisfies PageSignals;

            const changed =
                rewrite.outcomes.some(outcome => outcome.kind === "rewritten") ||
                recovery.recovered.length > 0;
            if (changed) {
                const updated = await this.updatePage.execute(page.entry.pageId, {
                    bindings: recovery.bindings
                });
                if (updated.isFail()) {
                    failed.push({
                        sourceUrl: page.entry.sourceUrl,
                        reason: `Created but could not rewrite its links: ${updated.error.message}`
                    });
                    continue;
                }
            }

            const published = await this.publishPage.execute({ id: page.entry.pageId });
            if (published.isFail()) {
                failed.push({
                    sourceUrl: page.entry.sourceUrl,
                    reason: `Created but could not publish: ${published.error.message}`
                });
            }
        }

        const counts = tally(outcomes);
        const links = {
            // Before and after are equal by construction: rewriting replaces a destination's value
            // and never removes the binding. Both are reported so a drop would show rather than hide.
            before: counts.destinations,
            after: counts.destinations,
            rewritten: counts.rewritten,
            external: counts.external,
            unmigrated: counts.unmigrated,
            dropped: created.reduce((total, item) => total + item.invented.length, 0),
            recovered: recovered.length
        };

        const stored = await this.pageMaps.set({
            runId,
            composedOn: new Date().toISOString(),
            pages: created.map(page => page.entry),
            failed,
            links,
            discarded
        });
        if (stored.isFail()) {
            return Result.fail(stored.error);
        }

        return Result.ok({ created: created.length, failed: failed.length, links });
    }

    /**
     * One placeable component per promoted signature.
     *
     * Promote is what decides a component's FINAL name (a collision is resolved by renaming), and the
     * page element addresses a component by name — so the name comes from Promote while the manifest
     * comes from the Generate artifact's stored source. A signature Promote skipped is simply absent,
     * and every instance of it is reported as a page-level failure rather than placed half-built.
     */
    private async resolveComponents(params: {
        promote: PromoteArtifact;
        generate: GenerateArtifact;
        segmentByUrl: Map<string, SegmentedPage>;
        trees: Map<string, CapturedNode>;
    }): Promise<Map<string, PlaceableComponent>> {
        const { promote, generate, segmentByUrl, trees } = params;

        // Composition needs each component's props and its cluster members, which the Generate
        // aggregate references rather than carries — so they are resolved once, here, for the whole
        // run. Only promoted components are placed, but resolving all of them keeps this a single
        // pass rather than a fetch inside the loop.
        const resolved = await readComponents(this.artifacts, generate);
        if (resolved.isFail()) {
            return new Map<string, PlaceableComponent>();
        }
        const generated = new Map(
            resolved.value.map(component => [component.signature, component])
        );
        const placeable = new Map<string, PlaceableComponent>();

        for (const promoted of promote.promoted) {
            const component = generated.get(promoted.signature);
            if (!component) {
                continue;
            }

            // The bundler persists the manifest alongside the bundle, built from the same expression
            // the bundle embeds. Reading it here means the API and the browser agree by construction
            // rather than by two implementations happening to match.
            const promotedComponent = await this.promotedComponent(promoted.componentId);
            const manifest = promotedComponent?.manifest ?? null;
            if (!manifest) {
                // A component whose manifest cannot be read cannot be placed; its instances will be
                // reported per page rather than failing the whole run.
                continue;
            }

            placeable.set(promoted.signature, {
                manifest,
                type: component.type,
                scalarInputs: scalarInputNames(manifest),
                fileShapes: fileInputShapes(promotedComponent?.source ?? ""),
                props: component.props,
                representativeTexts: await this.referenceTexts(component, segmentByUrl, trees)
            });
        }

        return placeable;
    }

    /**
     * Reads a promoted component's persisted manifest. Returns null when the component cannot be
     * read or carries no manifest — which means it was promoted before the bundler began persisting
     * one, or its bundling failed. Either way it cannot be placed, and the caller reports that per
     * page rather than failing the run.
     */
    private async promotedComponent(
        componentId: string
    ): Promise<{ manifest: ComponentManifest; source: string } | null> {
        const result = await this.getComponent.execute(componentId);

        if (result.isFail() || !result.value.manifest) {
            return null;
        }

        try {
            return {
                manifest: JSON.parse(result.value.manifest) as ComponentManifest,
                // The source comes back with the manifest so the two cannot describe different
                // components: how an input is READ is only answerable from the source.
                source: result.value.source ?? ""
            };
        } catch {
            return null;
        }
    }

    /**
     * The text runs of the member the cluster's prop samples were drawn from.
     *
     * `members[0]` is Cluster's first-seen member, which is the exemplar Classify, Plan and Generate
     * all worked from. If a W8 correction reshaped the cluster this may no longer be the member the
     * model saw, in which case alignment simply finds nothing and every prop falls back to the cluster
     * sample — visible in the map, never silent.
     */
    private async referenceTexts(
        component: GeneratedComponent,
        segmentByUrl: Map<string, SegmentedPage>,
        trees: Map<string, CapturedNode>
    ): Promise<string[]> {
        const reference = component.members[0];
        if (!reference) {
            return [];
        }

        const node = await this.sectionNode(
            reference.url,
            reference.sectionIndex,
            segmentByUrl,
            trees
        );
        return node ? collectSectionTexts(node) : [];
    }

    private async composePage(params: {
        page: AssembledPage;
        placeable: Map<string, PlaceableComponent>;
        segmentByUrl: Map<string, SegmentedPage>;
        trees: Map<string, CapturedNode>;
    }): Promise<Result<CreatedPage, PageCompositionError>> {
        const { page, placeable, segmentByUrl, trees } = params;
        const identity = toPageIdentity(page.url, page.title);

        const placements: ComponentPlacement[] = [];
        // Per placement, because the element each one becomes is only known once the document is
        // built, and both the destination check and the recovery pass work on specific elements.
        const capturedByPlacement: Set<string>[] = [];
        const capturedImagesByPlacement: Set<string>[] = [];
        const unplaced: UnplacedInstance[] = [];
        const sourceTexts: string[] = [];
        for (const [index, instance] of page.instances.entries()) {
            const component = placeable.get(instance.signature);
            if (!component) {
                /*
                 * Recorded rather than skipped silently. Nothing on the composed page marks the gap —
                 * the section is simply not there — so this list is the only account of it, and the
                 * one number that explains a page whose section count does not match its source.
                 */
                unplaced.push({ signature: instance.signature, index });
                continue;
            }
            const derivedInputs = await this.instanceInputs({
                page,
                instance,
                component,
                segmentByUrl,
                trees
            });
            capturedByPlacement.push(derivedInputs.captured);
            capturedImagesByPlacement.push(derivedInputs.capturedImages);
            placements.push({ manifest: component.manifest, inputs: derivedInputs.inputs });

            // The source copy this instance was built from, for the text-coverage check later. Only
            // for placed instances: an unplaced one has no composed counterpart to look for it in,
            // and counting its text as missing would double-charge the same gap.
            sourceTexts.push(...derivedInputs.texts);
        }

        if (placements.length === 0) {
            return Result.fail(
                new PageCompositionError(`No promoted component could be placed on ${page.url}.`, {
                    url: page.url
                })
            );
        }

        const built = buildPageDocument({
            path: identity.path,
            title: identity.title,
            placements
        });
        const elements = built.elements;

        /*
         * Document order is the root's children list, in placement order — so the nth placement's
         * element id is the nth entry, which is what ties a section's captured links to the element
         * built from it.
         */
        const childIds: string[] = built.bindings.root?.inputs?.children?.static ?? [];
        const contextByElement = new Map<string, ElementContext>();
        for (const [index, captured] of capturedByPlacement.entries()) {
            const elementId = childIds[index];
            if (elementId) {
                contextByElement.set(elementId, {
                    captured,
                    capturedImages: capturedImagesByPlacement[index] ?? new Set<string>()
                });
            }
        }

        /*
         * Checked here rather than on the inputs, because this is the first point at which the page
         * is what it will actually be: `ElementFactory` fills anything the composition did not supply
         * from the input's own `params.defaultValue`, which happens after the inputs are handed over.
         */
        let sourceHost = "";
        try {
            sourceHost = new URL(page.url).host;
        } catch {
            sourceHost = "";
        }
        const stripped = stripInventedBindings({
            bindings: built.bindings,
            contextByElement,
            sourceHost
        });
        /*
         * After the strip, not before: an invented image is emptied, and repointing it first would
         * spend a lookup on a value about to go and count it as an image this migration carries.
         */
        /*
         * Primed before the rewrite because the rewrite is synchronous, and synchronous is what keeps
         * it a pure decision over bindings rather than a function that reaches for a store per value.
         * The resolver caches across pages, so a logo on every page is looked up once for the run.
         */
        await this.assetUrls.prime(imageUrlsIn(stripped.bindings));

        const repointed = rewriteImageSources({
            bindings: stripped.bindings,
            resolve: sourceUrl => this.assetUrls.resolve(sourceUrl)
        });

        const bindings = repointed.bindings;
        const invented = stripped.invented;
        const inventedImages = stripped.inventedImages;
        const imageSources = repointed.outcomes;

        const createdPage = await this.createPage.execute({
            location: { folderId: ROOT_FOLDER },
            properties: { title: identity.title, path: identity.path },
            metadata: { documentType: "page", pageType: "static" },
            elements,
            bindings,
            extensions: {}
        });

        if (createdPage.isFail()) {
            return Result.fail(
                new PageCompositionError(
                    `Could not create a page for ${page.url}: ${createdPage.error.message}`,
                    { url: page.url }
                )
            );
        }

        /*
         * Not published here. Destinations can only be rewritten once every page exists — a link on
         * the first page may point at the last — and publishing before that would put a page live
         * with its internal links still absolute.
         */
        return Result.ok({
            entry: {
                sourceUrl: page.url,
                normalizedUrl: normalizeUrl(page.url),
                path: identity.path,
                title: identity.title,
                pageId: createdPage.value.id,
                entryId: createdPage.value.entryId
            },
            bindings,
            invented,
            inventedImages,
            imageSources,
            coverage: {
                sourceSections: segmentByUrl.get(page.url)?.sections.length ?? 0,
                assembledInstances: page.instances.length,
                composedInstances: placements.length,
                unplaced,
                sourceTexts
            }
        });
    }

    /**
     * This instance's input values.
     *
     * Assemble's `propValues` hold one cluster-wide sample repeated for every instance, so they are
     * deliberately not used: the values are re-derived from this page's own captured section. Where a
     * prop cannot be aligned the cluster sample stands, which is exactly Assemble's behaviour.
     */
    private async instanceInputs(params: {
        page: AssembledPage;
        instance: ComponentInstance;
        component: PlaceableComponent;
        segmentByUrl: Map<string, SegmentedPage>;
        trees: Map<string, CapturedNode>;
    }): Promise<{
        inputs: Record<string, unknown>;
        captured: Set<string>;
        capturedImages: Set<string>;
        texts: string[];
    }> {
        const { page, instance, component, segmentByUrl, trees } = params;

        const node = await this.sectionNode(page.url, instance.sectionIndex, segmentByUrl, trees);
        const instanceTexts = node ? collectSectionTexts(node) : [];

        const derived = deriveInstanceProps({
            props: component.props,
            representativeTexts: component.representativeTexts,
            instanceTexts
        });

        /*
         * Three layers, in increasing order of confidence.
         *
         * The component's own defaults sit underneath, because passing any `inputs` at all makes
         * `ElementFactory` ignore `defaults.inputs` entirely — so anything not derived would come out
         * empty rather than falling back to the generated sample.
         *
         * Composites and lists go on top of that, derived element-wise from this page's captured
         * section: a footer's real columns and destinations instead of the model's `href: "#"`
         * placeholders.
         *
         * Scalars go on last. They are the most reliable of the three (aligned against the cluster
         * representative) and a scalar and a composite never name the same input, so the ordering
         * only matters for reading the code.
         *
         * A derived string is still bound ONLY to a non-list scalar input: a list input handed a
         * string throws outright inside `ComponentInputTraverser`.
         */
        const inputs: Record<string, unknown> = { ...(component.manifest.defaults?.inputs ?? {}) };

        if (node) {
            Object.assign(
                inputs,
                deriveCompositeInputs({
                    node,
                    manifest: component.manifest,
                    sourceUrl: page.url,
                    fileShapes: component.fileShapes
                })
            );
        }

        for (const prop of derived) {
            if (component.scalarInputs.has(prop.name)) {
                inputs[prop.name] = prop.value;
            }
        }

        const previewed = applyFormPreview({
            manifest: component.manifest,
            componentType: component.type,
            inputs
        });

        /*
         * The links this section actually had, carried out so the finished page can be checked
         * against them. The check itself happens on the bindings, not here — see `composePage`.
         */
        const captured = node ? collectLinks(node).map(link => link.href) : [];
        // The images this section actually showed, so an image the model invented can be told from
        // one the page had — the same question the links above answer for destinations.
        const capturedImages = node ? collectImages(node).map(image => image.src) : [];

        /*
         * The section's own copy, taken from the node already resolved above. Carried out with the
         * links rather than walked again in the caller: it is the same node, and resolving it twice
         * would be two answers to one question.
         */
        const texts = node ? collectSectionTexts(node) : [];

        return {
            inputs: previewed,
            captured: new Set(captured),
            capturedImages: new Set(capturedImages),
            texts
        };
    }

    /** The captured node for one section of one page, resolved by the box Segment recorded. */
    private async sectionNode(
        url: string,
        sectionIndex: number,
        segmentByUrl: Map<string, SegmentedPage>,
        trees: Map<string, CapturedNode>
    ): Promise<CapturedNode | null> {
        const page = segmentByUrl.get(url);
        if (!page) {
            return null;
        }

        const section = page.sections.find(candidate => candidate.index === sectionIndex);
        if (!section) {
            return null;
        }

        const tree = await this.pageTree(page, trees);
        return tree ? findNodeByBox(tree, section.box as Box) : null;
    }

    /** Page trees are read once per page and kept for the length of the composition. */
    private async pageTree(
        page: SegmentedPage,
        trees: Map<string, CapturedNode>
    ): Promise<CapturedNode | null> {
        const cached = trees.get(page.treeRef);
        if (cached) {
            return cached;
        }

        const bytes = await this.blobs.get(page.treeRef);
        if (bytes.isFail()) {
            return null;
        }

        try {
            const tree = JSON.parse(new TextDecoder().decode(bytes.value)) as CapturedNode;
            trees.set(page.treeRef, tree);
            return tree;
        } catch {
            return null;
        }
    }

    private async readArtifact<T>(
        run: Run,
        stage: "assemble" | "promote" | "generate" | "segment",
        name: string
    ): Promise<Result<T, PageCompositionError>> {
        const entry = stageEntry(run.stages, stage);
        if (!entry || entry.status !== "done") {
            return Result.fail(
                new PageCompositionError(`The ${stage} stage has not completed on this run.`, {
                    stage
                })
            );
        }

        /*
         * Take the ref the ledger records, not a key computed from the name. A stage with corrections
         * applied keeps its machine output at `<name>` and records the EFFECTIVE artifact as the
         * primary ref, so computing the key would quietly read the un-overridden output — Segment is
         * the one that matters here, where a `page.exclude` correction would otherwise be ignored and
         * pages the operator dropped would be composed anyway.
         *
         * The computed key stays as the fallback for runs written before the refs were named.
         */
        const key =
            entry.artifacts[name] ?? stageArtifactKey(run.id, stage, entry.stageVersion, name);
        const result = await this.artifacts.getJson<T>(key);
        if (result.isFail() || !result.value) {
            return Result.fail(
                new PageCompositionError(`The ${stage} artifact of this run could not be read.`, {
                    stage,
                    key
                })
            );
        }

        return Result.ok(result.value);
    }
}

export const ComposePagesService = Abstraction.createImplementation({
    implementation: ComposePagesServiceImpl,
    dependencies: [
        RunRepository,
        StageArtifactStore,
        BlobStore,
        CreatePageUseCase,
        PublishPageUseCase,
        UpdatePageUseCase,
        PageMapStore,
        GetRemoteComponentUseCase,
        AssetUrlResolver
    ]
});
