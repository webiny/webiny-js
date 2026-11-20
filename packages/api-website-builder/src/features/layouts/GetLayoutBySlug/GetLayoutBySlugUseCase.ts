import { Result } from "@webiny/feature/api";
import {
    GetLayoutBySlugUseCase as UseCaseAbstraction,
    GetPublishedLayoutBySlugRepository
} from "./abstractions.js";
import { GetPublishedLayoutRepository } from "~/features/layouts/GetPageLayout/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError } from "~/domain/layout/errors.js";
import { LayoutEntryId } from "~/domain/layout/LayoutEntryId.js";

class GetLayoutBySlugUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private bySlugRepository: GetPublishedLayoutBySlugRepository.Interface,
        private publishedRepository: GetPublishedLayoutRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        const slug = typeof params.slug === "string" ? params.slug.trim() : "";
        if (!slug) {
            return Result.ok(null);
        }

        const source = await this.bySlugRepository.execute(slug);
        if (source.isFail() || !source.value) {
            return source;
        }

        if (typeof params.language === "string" && params.language) {
            const versionId = LayoutEntryId.from(source.value.entryId).versionIn(params.language);
            const version = await this.publishedRepository.execute(versionId.toString());
            if (version.isFail()) {
                return version;
            }
            if (version.value) {
                return version;
            }
        }

        return source;
    }
}

export const GetLayoutBySlugUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutBySlugUseCaseImpl,
    dependencies: [WbPermissions, GetPublishedLayoutBySlugRepository, GetPublishedLayoutRepository]
});
