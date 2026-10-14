import { describe, expect, it } from "vitest";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { EntryToJobMapper } from "./mappers.js";

// The shared admin login on the dev instance, as the CMS stamps it on a job entry.
const SHARED = { id: "6ab0ec3d2ced950002a5e3c2", displayName: "Webiny Admin", type: "admin" };
const ANA = { id: "ana-1", displayName: "Ana Kovač", type: "admin" };

const entry = (values: Record<string, unknown>) =>
    ({
        id: "job-1#0001",
        entryId: "job-1",
        createdOn: "2026-10-12T08:00:00.000Z",
        savedOn: "2026-10-12T08:00:00.000Z",
        createdBy: SHARED,
        tenant: "root",
        values: { name: "71 Westland", siteUrl: "https://71westland.com", ...values }
    }) as unknown as CmsEntry;

describe("a job's owner", () => {
    it("is who created it, when nobody has assigned it", () => {
        const job = EntryToJobMapper.toJob(entry({}));
        expect(job.owner).toEqual(SHARED);
        expect(job.assignment).toBeNull();
    });

    it("is who it is assigned to, once assigned, and the creator stays recorded", () => {
        const assignment = {
            owner: ANA,
            assignedBy: SHARED,
            assignedOn: "2026-10-13T08:00:00.000Z"
        };
        const job = EntryToJobMapper.toJob(entry({ assignment }));
        expect(job.owner).toEqual(ANA);
        expect(job.createdBy).toEqual(SHARED);
        expect(job.assignment).toEqual(assignment);
    });
});
