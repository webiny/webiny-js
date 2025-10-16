import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { FolderLevelPermissions } from "./FolderLevelPermissions.js";
import { FolderLevelPermissions as FolderLevelPermissionsAbstraction } from "./abstractions.js";
import type { AcoContext, AcoFolderLevelPermissionsCrud } from "~/types.js";

interface LegacyDeps {
    context: AcoContext;
    crud: AcoFolderLevelPermissionsCrud;
}

export const FolderLevelPermissionsFeature = createFeature({
    name: "FolderLevelPermissions",
    register(container: Container, deps: LegacyDeps) {
        container.registerInstance(
            FolderLevelPermissionsAbstraction,
            new FolderLevelPermissions(deps.context, deps.crud)
        );
    }
});
