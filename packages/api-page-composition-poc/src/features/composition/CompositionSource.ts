import type {
    AssembleArtifact,
    CapturedNode,
    GeneratedComponent,
    SegmentedPage
} from "@webiny/api-component-extraction/domain/artifacts.js";
import type { PageMapEntry } from "~/domain/types.js";

/** A promoted component as a page addresses it: by name, with the Library record it lives in. */
export interface PromotedReference {
    signature: string;
    /** The Library record's id, in the tenant the reference belongs to. */
    componentId: string;
    name: string;
}

/** An image the run migrated: where it was captured, and its copy in the extraction tenant. */
export interface RunImage {
    sourceUrl: string;
    /** The extraction tenant's File Manager URL for it, which serves the same bytes. */
    url: string;
    sha256: string;
}

/** An earlier composition of this job, as its page map recorded it. */
export interface EarlierComposition {
    runId: string;
    /** Absent means the run's own (extraction) tenant. */
    tenantId?: string;
    pages: PageMapEntry[];
}

/**
 * Everything composition needs from the extraction tenant, read once and held as plain data.
 *
 * The seam between the two tenants. `CompositionReader` builds this in the extraction tenant;
 * `CompositionWriter` consumes it, possibly inside another tenant, and never reads extraction data
 * itself. Anything composition needs and this does not carry is a gap to add HERE, never a read to add
 * in the writer.
 */
export interface CompositionSource {
    runId: string;
    jobId: string;
    assemble: AssembleArtifact;
    /** Every generated component, resolved (props, members, source). */
    generated: GeneratedComponent[];
    segmentByUrl: Map<string, SegmentedPage>;
    /** Every captured page tree composition will touch, keyed by its blob ref. */
    trees: Map<string, CapturedNode>;
    /** This run's Promote output; null when Promote has not run. */
    promoted: PromotedReference[] | null;
    /**
     * The tenant `promoted`'s component ids belong to: the job's site tenant when the job approves there
     * (`siteTenantFromStart`). Absent means the extraction tenant, as for every older job.
     */
    promotedTenantId?: string;
    /** Every image the run migrated, for copying into another tenant. */
    images: RunImage[];
    /** The next compose version for this run's page map. */
    composeVersion: number;
    /** This run's previous composition and the other runs of the same job, for retiring their pages. */
    earlier: EarlierComposition[];
}
