// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { runInAction } from "mobx";
import { RunViewPresenterImpl } from "./RunViewPresenter.js";
import type { PageMapDto, RunDto, SiteDto } from "~/shared/types.js";

/*
 * The Site view reads everything in the SITE'S tenant. The admin's own requests carry the admin's
 * tenant, so the composed pages panel's reads (the extraction tenant's page map, `getPageByPath`) show
 * a different site's pages at the same paths, and nothing on screen says so. Ids are Take 3's.
 */
const TAKE3_RUN = "6aca03006edf6700023d80ce#0001";
const TAKE3_JOB = "6aca02ff6edf6700023d80cd#0001";
const TAKE3_TENANT = "parkcitytake380cd";

const run = (id: string, runNumber = 3): RunDto =>
    ({
        id,
        jobId: TAKE3_JOB,
        runNumber,
        stages: [
            { stage: "assemble", status: "done", taskId: "a" },
            { stage: "promote", status: "done", taskId: "p" }
        ]
    }) as unknown as RunDto;

const site = (builtFrom: string): SiteDto => ({
    jobId: TAKE3_JOB,
    tenantId: TAKE3_TENANT,
    tenantName: "ParkCity - Take 3",
    createdOn: "2026-10-10T13:00:00.000Z",
    lastBuild: {
        runId: builtFrom,
        status: "done",
        startedOn: "2026-10-10T13:00:00.000Z",
        steps: []
    }
});

const pageMap = {
    runId: TAKE3_RUN,
    composedOn: "2026-10-10T13:05:00.000Z",
    pages: [
        { path: "/", pageId: "6aca2cf70a0e#0001", sourceUrl: "https://www.parkcityplace.org/" }
    ],
    failed: [],
    links: {},
    discarded: []
} as unknown as PageMapDto;

const presenterFor = (record: SiteDto | null, onScreen: RunDto) => {
    const gateway = {
        getSite: vi.fn(async () => record),
        getRun: vi.fn(async (id: string) => run(id, 3)),
        getWebsiteDomain: vi.fn(async () => "https://example.test"),
        getStageArtifact: vi.fn(async () => ({ pages: [{}, {}, {}] })),
        getPageMap: vi.fn(async () => pageMap),
        getSiteLivePageIds: vi.fn(async () => ({ "/": "6aca2cf70a0e#0001" })),
        getLivePageIds: vi.fn(async () => ({}))
    };
    const presenter = new RunViewPresenterImpl(gateway as never);
    runInAction(() => {
        presenter.vm.run = onScreen;
    });
    return { presenter, gateway };
};

const settle = async () => {
    for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

describe("Site view", () => {
    it("reads the page map of the site's tenant, and liveness inside it", async () => {
        const { presenter, gateway } = presenterFor(site(TAKE3_RUN), run(TAKE3_RUN));

        presenter.openSite();
        await settle();

        expect(gateway.getPageMap).toHaveBeenCalledWith(TAKE3_RUN, TAKE3_TENANT);
        expect(gateway.getSiteLivePageIds).toHaveBeenCalledWith(TAKE3_JOB, ["/"]);
        // The admin-tenant check would answer with root's page at "/".
        expect(gateway.getLivePageIds).not.toHaveBeenCalled();
        expect(presenter.vm.sitePageMap).toEqual(pageMap);
        expect(presenter.vm.siteLivePageByPath).toEqual({ "/": "6aca2cf70a0e#0001" });
        expect(presenter.vm.siteAssembledCount).toBe(3);
        expect(presenter.vm.siteBuiltFrom).toEqual({ runId: TAKE3_RUN, runNumber: 3 });
        expect(gateway.getRun).not.toHaveBeenCalled();
    });

    it("reads the map of the run the site was built from, not the run on screen", async () => {
        const { presenter, gateway } = presenterFor(site(TAKE3_RUN), run("later#0001", 5));

        presenter.openSite();
        await settle();

        expect(gateway.getPageMap).toHaveBeenCalledWith(TAKE3_RUN, TAKE3_TENANT);
        // Named, so the view can say run 3's pages are showing on run 5.
        expect(gateway.getRun).toHaveBeenCalledWith(TAKE3_RUN);
        expect(presenter.vm.siteBuiltFrom).toEqual({ runId: TAKE3_RUN, runNumber: 3 });
    });

    it("reads no page map before the site exists", async () => {
        const { presenter, gateway } = presenterFor(null, run(TAKE3_RUN));

        presenter.openSite();
        await settle();

        expect(gateway.getPageMap).not.toHaveBeenCalled();
        expect(presenter.vm.sitePageMap).toBeNull();
        expect(presenter.vm.showSite).toBe(true);
    });

    it("closes when a stage is selected", async () => {
        const { presenter } = presenterFor(site(TAKE3_RUN), run(TAKE3_RUN));
        presenter.openSite();
        await settle();

        presenter.selectStage("promote");

        expect(presenter.vm.showSite).toBe(false);
    });
});
