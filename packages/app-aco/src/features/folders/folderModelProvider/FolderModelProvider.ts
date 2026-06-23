import { createFieldsList } from "@webiny/app-headless-cms-common";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

import { GetFolderModelRepository } from "./abstractions.js";
import { FolderModelProvider as Provider } from "~/features/folders/abstractions.js";

class FolderModelProviderImpl implements Provider.Interface {
    constructor(private repository: GetFolderModelRepository.Interface) {}

    async getModel(): Promise<CmsModel> {
        await this.repository.load();

        const model = this.repository.getModel();
        if (!model) {
            // Something went seriously wrong!
            throw new Error("Unable to load File model!");
        }

        return model;
    }

    async getGraphQLSelection(): Promise<string> {
        const model = await this.getModel();

        const fields = model.valuesSelection
            ? model.valuesSelection
            : createFieldsList({ model, fields: model.fields });

        return /* GraphQL */ `{
            id
            createdOn
            createdBy {
                id
                displayName
            }
            savedOn
            savedBy {
                id
                displayName
            }
            modifiedOn
            modifiedBy {
                id
                displayName
            }
            permissions {
                target
                level
                inheritedFrom
            }
            hasNonInheritedPermissions
            canManagePermissions
            canManageStructure
            canManageContent
            ${fields}
        }`;
    }
}

export const FolderModelProvider = Provider.createImplementation({
    implementation: FolderModelProviderImpl,
    dependencies: [GetFolderModelRepository]
});
