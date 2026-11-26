/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { RouterRepository } from "@webiny/app/features/router/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import { Routes } from "~/routes.js";
import { CmsEntryError } from "~/features/contentEntry/CmsEntryError.js";
import { GetLatestSingletonEntryUseCase } from "~/features/contentEntry/singletonEditor/getLatest/abstractions.js";
import { SingletonEditorPresenter as Abstraction } from "./abstractions.js";
import { SingletonEditorPresenter } from "./SingletonEditorPresenter.js";

const MODEL = { modelId: "settings", fields: [{ id: "f1" }] } as unknown as CmsModel;
const EMPTY_MODEL = { modelId: "settings", fields: [] } as unknown as CmsModel;
const ENTRY = { id: "entry-1#0001" } as unknown as CmsContentEntry;

function setup(result: Result<CmsContentEntry, CmsEntryError> = Result.ok(ENTRY)) {
    const container = new Container();
    const execute = vi.fn(async () => result);
    const replaceRoute = vi.fn();

    container.registerInstance(RouterRepository, {
        replaceRoute
    } as unknown as RouterRepository.Interface);
    container.registerInstance(GetLatestSingletonEntryUseCase, { execute });
    container.register(SingletonEditorPresenter).inSingletonScope();

    return { presenter: container.resolve(Abstraction), execute, replaceRoute };
}

type FetchResult = Result<CmsContentEntry, CmsEntryError>;

function createDeferred() {
    let resolve!: (value: FetchResult) => void;
    const promise = new Promise<FetchResult>(res => {
        resolve = res;
    });
    return { promise, resolve };
}

describe("SingletonEditorPresenter", () => {
    it("reports no fields and does not fetch", async () => {
        const { presenter, execute } = setup();

        await presenter.init(EMPTY_MODEL, undefined);

        expect(presenter.vm.hasFields).toBe(false);
        expect(execute).not.toHaveBeenCalled();
    });

    it("uses the route entry id without fetching", async () => {
        const { presenter, execute } = setup();

        await presenter.init(MODEL, "route-id#0001");

        expect(presenter.vm.entryId).toBe("route-id#0001");
        expect(execute).not.toHaveBeenCalled();
    });

    it("fetches the latest entry and replaces the route when there is no route id", async () => {
        const { presenter, execute, replaceRoute } = setup();

        await presenter.init(MODEL, undefined);

        expect(execute).toHaveBeenCalledWith(MODEL);
        expect(replaceRoute).toHaveBeenCalledWith(Routes.ContentEntries.List, {
            modelId: "settings",
            id: ENTRY.id
        });
        expect(presenter.vm.entryId).toBe(ENTRY.id);
        expect(presenter.vm.loading).toBe(false);
    });

    it("exposes the error message when the fetch fails", async () => {
        const { presenter, replaceRoute } = setup(
            Result.fail(new CmsEntryError(undefined, "Could not fetch singleton entry"))
        );

        await presenter.init(MODEL, undefined);

        expect(presenter.vm.error).toBe("Could not fetch singleton entry");
        expect(presenter.vm.entryId).toBeNull();
        expect(replaceRoute).not.toHaveBeenCalled();
    });

    it("updates the entry id when init runs again with a new route id", async () => {
        const { presenter } = setup();

        await presenter.init(MODEL, "a#0001");
        await presenter.init(MODEL, "a#0002");

        expect(presenter.vm.entryId).toBe("a#0002");
    });

    it("is loading while the fetch is pending", async () => {
        const { presenter, execute } = setup();
        execute.mockImplementation(() => new Promise(() => {}));

        void presenter.init(MODEL, undefined);

        expect(presenter.vm.loading).toBe(true);
    });

    it("ignores a stale fetch when init runs again while pending", async () => {
        const { presenter, execute, replaceRoute } = setup();
        const deferred = createDeferred();
        execute.mockImplementation(() => deferred.promise);

        const first = presenter.init(MODEL, undefined);
        await presenter.init(MODEL, "x#0002");
        deferred.resolve(Result.ok(ENTRY));
        await first;

        expect(presenter.vm.entryId).toBe("x#0002");
        expect(presenter.vm.loading).toBe(false);
        expect(replaceRoute).not.toHaveBeenCalled();
    });

    it("ignores a late fetch after dispose", async () => {
        const { presenter, execute, replaceRoute } = setup();
        const deferred = createDeferred();
        execute.mockImplementation(() => deferred.promise);

        const pending = presenter.init(MODEL, undefined);
        presenter.dispose();
        deferred.resolve(Result.ok(ENTRY));
        await pending;

        expect(presenter.vm.entryId).toBeNull();
        expect(replaceRoute).not.toHaveBeenCalled();
    });
});
