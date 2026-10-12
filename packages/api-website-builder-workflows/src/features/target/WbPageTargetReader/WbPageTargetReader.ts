import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { PageModelProvider } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { EntryToPageMapper } from "@webiny/api-website-builder/domain/page/EntryToPageMapper.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader as Abstraction } from "./abstractions.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

/**
 * The page model is private (`authorization: false`), so `PageModelProvider` reads it for any
 * identity as the current one; nothing reads models without authorization (A19).
 */
class WbPageTargetReaderImpl implements Abstraction.Interface {
    public constructor(
        private pageModelProvider: PageModelProvider.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface
    ) {}

    public async read(params: Abstraction.Params): Promise<Abstraction.Target | null> {
        if (params.model !== WB_PAGE_NAMESPACE) {
            return null;
        }

        const model = await this.pageModelProvider.get();
        const entry = await this.getRevisionById.execute(model, params.targetRevisionId);
        if (entry.isFail()) {
            if (entry.error.code === ENTRY_NOT_FOUND) {
                return null;
            }
            throw entry.error;
        }

        return { model, page: EntryToPageMapper.toPage(entry.value) };
    }
}

export const WbPageTargetReader = Abstraction.createImplementation({
    implementation: WbPageTargetReaderImpl,
    dependencies: [PageModelProvider, GetRevisionByIdUseCase]
});
