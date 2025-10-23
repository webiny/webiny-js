import { createFeature } from "@webiny/feature/api";
import { TenantLinksRepository } from "./shared/TenantLinksRepository.js";
import { CreateTenantLinksFeature } from "./CreateTenantLinks/feature.js";
import { UpdateTenantLinksFeature } from "./UpdateTenantLinks/feature.js";
import { DeleteTenantLinksFeature } from "./DeleteTenantLinks/feature.js";
import { ListTenantLinksByTypeFeature } from "./ListTenantLinksByType/feature.js";
import { ListTenantLinksByTenantFeature } from "./ListTenantLinksByTenant/feature.js";
import { ListTenantLinksByIdentityFeature } from "./ListTenantLinksByIdentity/feature.js";
import { GetTenantLinkByIdentityFeature } from "./GetTenantLinkByIdentity/feature.js";

export const TenantLinksFeature = createFeature({
    name: "TenantLinks",
    register(container) {
        // Register repository
        container.register(TenantLinksRepository).inSingletonScope();

        // Register use cases
        CreateTenantLinksFeature.register(container);
        UpdateTenantLinksFeature.register(container);
        DeleteTenantLinksFeature.register(container);
        ListTenantLinksByTypeFeature.register(container);
        ListTenantLinksByTenantFeature.register(container);
        ListTenantLinksByIdentityFeature.register(container);
        GetTenantLinkByIdentityFeature.register(container);
    }
});
