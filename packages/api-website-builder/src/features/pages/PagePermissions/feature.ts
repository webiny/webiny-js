import { Abstraction } from "@webiny/di";
import { createFeature, Result } from "@webiny/feature/api";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { CreatePageRevisionFromUseCase } from "~/features/pages/CreatePageRevisionFrom/index.js";
import { DeletePageUseCase } from "~/features/pages/DeletePage/index.js";
import { DuplicatePageUseCase } from "~/features/pages/DuplicatePage/index.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { GetPageByPathUseCase } from "~/features/pages/GetPageByPath/index.js";
import { GetPageRevisionsUseCase } from "~/features/pages/GetPageRevisions/index.js";
import { ListPagesUseCase } from "~/features/pages/ListPages/index.js";
import { MovePageUseCase } from "~/features/pages/MovePage/index.js";
import { PublishPageUseCase } from "~/features/pages/PublishPage/index.js";
import { UnpublishPageUseCase } from "~/features/pages/UnpublishPage/index.js";
import { UpdatePageUseCase } from "~/features/pages/UpdatePage/index.js";

const createDecorator = (abstraction: Abstraction<any>) => {
    class PageUseCaseDecorator {
        constructor(
            private identityContext: IdentityContext.Interface,
            private decoratee: any
        ) {}

        async execute(...args: any[]) {
            const hasPermission = await this.identityContext.getPermission("wb.page");

            if (!hasPermission) {
                return Result.fail(new PageNotAuthorizedError());
            }

            return this.decoratee.execute(...args);
        }
    }

    return abstraction.createDecorator({
        decorator: PageUseCaseDecorator,
        dependencies: [IdentityContext]
    });
};

export const PagePermissionsFeature = createFeature({
    name: "WebsiteBuilder/Page/Permissions",
    register(container) {
        container.registerDecorator(createDecorator(CreatePageUseCase));
        container.registerDecorator(createDecorator(CreatePageRevisionFromUseCase));
        container.registerDecorator(createDecorator(UpdatePageUseCase));
        container.registerDecorator(createDecorator(DeletePageUseCase));
        container.registerDecorator(createDecorator(DuplicatePageUseCase));
        container.registerDecorator(createDecorator(GetPageByIdUseCase));
        container.registerDecorator(createDecorator(GetPageByPathUseCase));
        container.registerDecorator(createDecorator(GetPageRevisionsUseCase));
        container.registerDecorator(createDecorator(ListPagesUseCase));
        container.registerDecorator(createDecorator(MovePageUseCase));
        container.registerDecorator(createDecorator(PublishPageUseCase));
        container.registerDecorator(createDecorator(UnpublishPageUseCase));
    }
});
