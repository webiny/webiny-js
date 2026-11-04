import { Result } from "@webiny/feature/api";
import {
    LayoutSlugAvailability as ServiceAbstraction,
    ListLayoutsBySlugRepository
} from "./abstractions.js";
import { LayoutSlugTakenError } from "~/domain/layout/errors.js";
import type { LayoutSlug } from "~/domain/layout/LayoutSlug.js";

// A site has a handful of layouts: this many copies of one slug means something else is wrong.
const MAX_CANDIDATES = 100;

class LayoutSlugAvailabilityImpl implements ServiceAbstraction.Interface {
    constructor(private repository: ListLayoutsBySlugRepository.Interface) {}

    async ensureAvailable(
        slug: LayoutSlug,
        entryId?: string
    ): Promise<Result<void, ServiceAbstraction.Error>> {
        const result = await this.repository.execute(slug.toString());
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const owner = result.value.find(layout => layout.entryId !== entryId);
        if (owner) {
            return Result.fail(
                new LayoutSlugTakenError({
                    slug: slug.toString(),
                    layoutId: owner.entryId,
                    title: owner.properties.title
                })
            );
        }

        return Result.ok();
    }

    async firstAvailable(
        slug: LayoutSlug
    ): Promise<Result<LayoutSlug, ListLayoutsBySlugRepository.Error>> {
        for (let index = 1; index <= MAX_CANDIDATES; index++) {
            const candidate = slug.candidate(index);
            const result = await this.repository.execute(candidate.toString());
            if (result.isFail()) {
                return Result.fail(result.error);
            }
            if (result.value.length === 0) {
                return Result.ok(candidate);
            }
        }

        return Result.ok(slug.candidate(Date.now()));
    }
}

export const LayoutSlugAvailability = ServiceAbstraction.createImplementation({
    implementation: LayoutSlugAvailabilityImpl,
    dependencies: [ListLayoutsBySlugRepository]
});
