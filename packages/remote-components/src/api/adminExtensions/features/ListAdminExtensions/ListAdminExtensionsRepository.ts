import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListEntriesRepository } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryListWhereValues } from "@webiny/api-headless-cms/types/index.js";
import { ListAdminExtensionsRepository as RepositoryAbstraction } from "./abstractions.js";
import { AdminExtensionModelNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionPersistenceError } from "~/api/adminExtensions/domain/errors.js";
import { ADMIN_EXTENSION_MODEL_ID } from "~/api/adminExtensions/domain/constants.js";
import { mapEntryToAdminExtension } from "~/api/adminExtensions/domain/mapEntryToAdminExtension.js";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";
import type { AdminExtensionValues } from "~/api/adminExtensions/domain/AdminExtension.js";

const PAGE_SIZE = 100;

type ListResult = Awaited<ListEntriesRepository.Return<AdminExtensionValues>>;

function toValuesWhere(where: RepositoryAbstraction.Where): CmsEntryListWhereValues {
    const values: CmsEntryListWhereValues = {};

    if (where.kind) {
        values["kind"] = where.kind;
    }
    if (where.name) {
        values["name"] = where.name;
    }
    if (typeof where.enabled === "boolean") {
        values["enabled"] = where.enabled;
    }

    return values;
}

class ListAdminExtensionsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly listEntriesRepository: ListEntriesRepository.Interface
    ) {}

    async execute(
        where: RepositoryAbstraction.Where
    ): Promise<Result<AdminExtension[], RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(ADMIN_EXTENSION_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new AdminExtensionModelNotFoundError(ADMIN_EXTENSION_MODEL_ID));
            }

            const values = toValuesWhere(where);
            const items: AdminExtension[] = [];
            let after: string | undefined = undefined;

            do {
                const listResult: ListResult =
                    await this.listEntriesRepository.execute<AdminExtensionValues>(
                        modelResult.value,
                        {
                            where: { values, latest: true },
                            sort: ["createdOn_DESC"],
                            limit: PAGE_SIZE,
                            after
                        }
                    );

                if (listResult.isFail()) {
                    return Result.fail(new AdminExtensionPersistenceError(listResult.error));
                }

                const entries: CmsEntry<AdminExtensionValues>[] = listResult.value.entries;
                for (const entry of entries) {
                    items.push(mapEntryToAdminExtension(entry));
                }

                after = listResult.value.meta.cursor ?? undefined;
            } while (after);

            return Result.ok(items);
        } catch (error) {
            return Result.fail(new AdminExtensionPersistenceError(error));
        }
    }
}

export const ListAdminExtensionsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListAdminExtensionsRepositoryImpl,
    dependencies: [GetModelRepository, ListEntriesRepository]
});
