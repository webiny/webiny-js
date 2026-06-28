import type { Container } from "@webiny/di";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import type { IRequestContextInitializer } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FileModel } from "~/domain/file/abstractions.js";
import { FILE_MODEL_ID } from "~/domain/file/file.model.js";

class FileModelContextualSchemaImpl implements IRequestContextInitializer {
    constructor(
        private tenantCtx: TenantContext.Interface,
        private identityCtx: IdentityContext.Interface
    ) {}

    async init(ctx: Record<string, any>): Promise<void> {
        if (!this.tenantCtx.getTenant()) {
            return;
        }

        const container = ctx.container as Container;
        // Resolved lazily here (build/request time), not as a constructor dep: GetModelUseCase
        // depends on AccessControl, which the CMS initializer only registers during its own init().
        const getModel = container.resolve(GetModelUseCase);

        await this.identityCtx.withoutAuthorization(async () => {
            const result = await getModel.execute(FILE_MODEL_ID);
            if (result.value) {
                container.registerInstance(FileModel, result.value);
            }
        });
    }
}

export const FileModelContextualSchema = RequestContextInitializer.createImplementation({
    implementation: FileModelContextualSchemaImpl,
    dependencies: [TenantContext, IdentityContext]
});
