import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ReviewerPickerPresenterFeature } from "./feature.js";
import { ReviewerPickerFactory } from "./ReviewerPickerFactory.js";
import type { ReviewerPickerInitParams } from "./abstractions.js";
import type { StepCandidate } from "~/review/domain/types.js";

const CANDIDATES: StepCandidate[] = [
    {
        id: "u1",
        displayName: "Ivan Horvat",
        teamNames: ["Marketing"],
        excluded: false,
        excludedReason: null
    },
    { id: "u2", displayName: "Luka Perić", teamNames: [], excluded: false, excludedReason: null },
    {
        id: "u3",
        displayName: "Petra Novak",
        teamNames: [],
        excluded: true,
        excludedReason: "on leave"
    },
    { id: "u4", displayName: "Hana Radić", teamNames: [], excluded: true, excludedReason: null }
];

const createPresenter = () => {
    const container = new Container();
    ReviewerPickerPresenterFeature.register(container);
    return ReviewerPickerPresenterFeature.resolve(container).presenter;
};

const params = (overrides: Partial<ReviewerPickerInitParams> = {}): ReviewerPickerInitParams => {
    return {
        load: vi.fn().mockResolvedValue(CANDIDATES),
        currentOwnerId: null,
        selectedId: null,
        ...overrides
    };
};

describe("ReviewerPickerPresenter", () => {
    let presenter: ReturnType<typeof createPresenter>;

    beforeEach(() => {
        presenter = createPresenter();
    });

    it("is loading until the candidates arrive", async () => {
        const pending = presenter.init(params());
        expect(presenter.vm.loading).toBe(true);

        await pending;

        expect(presenter.vm.loading).toBe(false);
        expect(presenter.vm.error).toBeNull();
    });

    it("lists excluded people as disabled 'Unavailable', with the reason only when sent (D97)", async () => {
        await presenter.init(params());

        expect(presenter.vm.options).toEqual([
            {
                label: "Ivan Horvat",
                value: "u1",
                disabled: false,
                initials: "IH",
                teams: "Marketing",
                note: null
            },
            {
                label: "Luka Perić",
                value: "u2",
                disabled: false,
                initials: "LP",
                teams: "",
                note: null
            },
            {
                label: "Petra Novak",
                value: "u3",
                disabled: true,
                initials: "PN",
                teams: "",
                note: "Unavailable: on leave"
            },
            {
                label: "Hana Radić",
                value: "u4",
                disabled: true,
                initials: "HR",
                teams: "",
                note: "Unavailable"
            }
        ]);
        expect(presenter.vm.eligibleCount).toBe(2);
    });

    it("lists the current owner as disabled 'Current owner' (R209)", async () => {
        await presenter.init(params({ currentOwnerId: "u2" }));

        expect(presenter.vm.options[1]).toEqual({
            label: "Luka Perić",
            value: "u2",
            disabled: true,
            initials: "LP",
            teams: "",
            note: "Current owner"
        });
        expect(presenter.vm.eligibleCount).toBe(1);
    });

    it("filters client-side by name, case-insensitively", async () => {
        await presenter.init(params());

        presenter.search("ivan");

        expect(presenter.vm.options.map(option => option.value)).toEqual(["u1"]);
        expect(presenter.vm.query).toBe("ivan");
    });

    it("filters on the plain name, not on the Unavailable or Current owner suffix", async () => {
        await presenter.init(params({ currentOwnerId: "u2" }));

        presenter.search("owner");
        expect(presenter.vm.options).toEqual([]);

        presenter.search("unavail");
        expect(presenter.vm.options).toEqual([]);
    });

    it("explains an empty search result", async () => {
        await presenter.init(params());

        presenter.search("zzz");

        expect(presenter.vm.options).toEqual([]);
        expect(presenter.vm.emptyMessage).toBe("Nothing matches “zzz”.");
    });

    it("selects a selectable person and ignores disabled and unknown ids", async () => {
        await presenter.init(params({ currentOwnerId: "u2" }));

        presenter.select("u1");
        expect(presenter.vm.value).toBe("u1");

        presenter.select("u2");
        presenter.select("u3");
        presenter.select("nobody");
        expect(presenter.vm.value).toBe("u1");
    });

    it("keeps a preselected person", async () => {
        await presenter.init(params({ selectedId: "u2" }));

        expect(presenter.vm.value).toBe("u2");
    });

    it("shows 'Could not load results.' when the load rejects and retries with the selection kept", async () => {
        const load = vi
            .fn()
            .mockRejectedValueOnce(new Error("Network."))
            .mockResolvedValue(CANDIDATES);
        await presenter.init(params({ load, selectedId: "u1" }));

        expect(presenter.vm.error).toBe("Could not load results.");
        expect(presenter.vm.options).toEqual([]);

        await presenter.retry();

        expect(load).toHaveBeenCalledTimes(2);
        expect(presenter.vm.error).toBeNull();
        expect(presenter.vm.value).toBe("u1");
        expect(presenter.vm.options).toHaveLength(4);
    });

    it("ignores a late response after dispose and resets", async () => {
        let release: (value: StepCandidate[]) => void = () => undefined;
        const load = vi.fn().mockReturnValue(
            new Promise<StepCandidate[]>(resolve => {
                release = resolve;
            })
        );
        const pending = presenter.init(params({ load }));

        presenter.dispose();
        release(CANDIDATES);
        await pending;

        expect(presenter.vm.options).toEqual([]);
        expect(presenter.vm.loading).toBe(false);
    });

    it("hands out a new presenter per factory call", () => {
        const container = new Container();
        ReviewerPickerPresenterFeature.register(container);
        const factory = container.resolve(ReviewerPickerFactory);
        expect(factory.create()).not.toBe(factory.create());
    });

    it("is transient", () => {
        const container = new Container();
        ReviewerPickerPresenterFeature.register(container);
        const first = ReviewerPickerPresenterFeature.resolve(container).presenter;
        const second = ReviewerPickerPresenterFeature.resolve(container).presenter;
        expect(first).not.toBe(second);
    });
});
