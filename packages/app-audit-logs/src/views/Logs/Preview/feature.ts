import { createFeature } from "@webiny/feature/admin";
import { useFeature } from "@webiny/app-admin";
import { AuditLogDetailsPresenter as Abstraction } from "./abstractions.js";
import { AuditLogDetailsPresenter } from "./AuditLogDetailsPresenter.js";

export const AuditLogDetailsPresenterFeature = createFeature({
    name: "AuditLogs/DetailsPresenter",
    register(container) {
        container.register(AuditLogDetailsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});

export function useAuditLogDetailsPresenter(): Abstraction.Interface {
    const { presenter } = useFeature(AuditLogDetailsPresenterFeature);
    return presenter;
}
