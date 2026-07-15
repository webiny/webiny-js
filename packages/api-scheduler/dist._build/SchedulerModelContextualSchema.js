import { RequestContextInitializer } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ScheduledActionModel } from "./shared/abstractions.js";
import { SCHEDULE_MODEL_ID } from "./constants.js";
class SchedulerModelContextualSchemaImpl {
    constructor(tenantCtx, identityCtx){
        this.tenantCtx = tenantCtx;
        this.identityCtx = identityCtx;
    }
    async init(ctx) {
        if (!this.tenantCtx.getTenant()) return;
        const container = ctx.container;
        const getModel = container.resolve(GetModelUseCase);
        await this.identityCtx.withoutAuthorization(async ()=>{
            const result = await getModel.execute(SCHEDULE_MODEL_ID);
            if (result.isFail()) throw result.error;
            container.registerInstance(ScheduledActionModel, result.value);
        });
    }
}
const SchedulerModelContextualSchema = RequestContextInitializer.createImplementation({
    implementation: SchedulerModelContextualSchemaImpl,
    dependencies: [
        TenantContext,
        IdentityContext
    ]
});
export { SchedulerModelContextualSchema };

//# sourceMappingURL=SchedulerModelContextualSchema.js.map