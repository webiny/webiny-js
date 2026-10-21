import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetGlobalComponentRepository } from "@webiny/api-website-builder/features/globals/GetGlobalComponent/index.js";
import { SaveGlobalComponentRepository } from "@webiny/api-website-builder/features/globals/SaveGlobalComponent/index.js";
import { GlobalComponentLanguage } from "@webiny/api-website-builder/exports/api/website-builder/globals.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";

type GlobalComponent = SaveGlobalComponentRepository.GlobalComponent;

// One audit trail per global component and language, e.g. `Demo/Header:de`; just the name for the
// `"default"` language (pages without one). Not `#`: listing audit logs by `Demo/Header#de` also
// returns those of `Demo/Header`.
const getEntityId = ({ name, language }: GlobalComponent) => {
    const globalLanguage = GlobalComponentLanguage.from(language);
    return globalLanguage.isDefault() ? name : `${name}:${globalLanguage.toString()}`;
};

/**
 * Audit every saved global component. The save repository is decorated, so saves from the editor and
 * from AI page translation are both audited, whichever storage a project replaces it with.
 */
class SaveGlobalComponentWithAuditLogImpl implements SaveGlobalComponentRepository.Interface {
    constructor(
        private recordAuditLog: RecordAuditLogUseCase.Interface,
        private getGlobalComponent: GetGlobalComponentRepository.Interface,
        private logger: Logger.Interface,
        private decoratee: SaveGlobalComponentRepository.Interface
    ) {}

    async execute(globalComponent: GlobalComponent): SaveGlobalComponentRepository.Return {
        const original = await this.getGlobalComponent.execute({
            name: globalComponent.name,
            language: globalComponent.language
        });

        const result = await this.decoratee.execute(globalComponent);
        if (result.isFail()) {
            return result;
        }

        const saved = result.value;
        const before = original.isOk() ? original.value : null;

        // The global component is already saved, so a failed audit log must not fail the save.
        try {
            const recordResult = await this.recordAuditLog.execute(
                before
                    ? {
                          audit: AUDIT.WEBSITE_BUILDER.GLOBAL_COMPONENT.UPDATE,
                          message: "Global Component Updated",
                          content: { before, after: saved },
                          entityId: getEntityId(saved)
                      }
                    : {
                          audit: AUDIT.WEBSITE_BUILDER.GLOBAL_COMPONENT.CREATE,
                          message: "Global Component Created",
                          content: saved,
                          entityId: getEntityId(saved)
                      }
            );
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            this.logger.warn(
                { reason: error.message, name: saved.name, language: saved.language },
                "Could not create the audit log of a saved global component."
            );
        }

        return result;
    }
}

export const SaveGlobalComponentWithAuditLog = SaveGlobalComponentRepository.createDecorator({
    decorator: SaveGlobalComponentWithAuditLogImpl,
    dependencies: [RecordAuditLogUseCase, GetGlobalComponentRepository, Logger]
});
