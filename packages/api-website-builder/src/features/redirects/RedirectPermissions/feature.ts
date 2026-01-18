import { Abstraction } from "@webiny/di";
import { createFeature, Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { RedirectNotAuthorizedError } from "~/domain/redirect/errors.js";
import { CreateRedirectUseCase } from "~/features/redirects/CreateRedirect/index.js";
import { UpdateRedirectUseCase } from "~/features/redirects/UpdateRedirect/index.js";
import { DeleteRedirectUseCase } from "~/features/redirects/DeleteRedirect/index.js";
import { GetActiveRedirectsUseCase } from "~/features/redirects/GetActiveRedirects/index.js";
import { GetRedirectByIdUseCase } from "~/features/redirects/GetRedirectById/index.js";
import { InvalidateRedirectsCacheUseCase } from "~/features/redirects/InvalidateRedirectsCache/index.js";
import { ListRedirectsUseCase } from "~/features/redirects/ListRedirects/index.js";
import { MoveRedirectUseCase } from "~/features/redirects/MoveRedirect/index.js";

const createDecorator = (abstraction: Abstraction<any>) => {
    class PageUseCaseDecorator {
        constructor(
            private identityContext: IdentityContext.Interface,
            private decoratee: any
        ) {}

        async execute(...args: any[]) {
            const hasPermission = await this.identityContext.getPermission("wb.redirect");

            if (!hasPermission) {
                return Result.fail(new RedirectNotAuthorizedError());
            }

            return this.decoratee.execute(...args);
        }
    }

    return abstraction.createDecorator({
        decorator: PageUseCaseDecorator,
        dependencies: [IdentityContext]
    });
};

export const RedirectPermissionsFeature = createFeature({
    name: "WebsiteBuilder/Redirect/Permissions",
    register(container) {
        container.registerDecorator(createDecorator(CreateRedirectUseCase));
        container.registerDecorator(createDecorator(UpdateRedirectUseCase));
        container.registerDecorator(createDecorator(DeleteRedirectUseCase));
        container.registerDecorator(createDecorator(GetActiveRedirectsUseCase));
        container.registerDecorator(createDecorator(GetRedirectByIdUseCase));
        container.registerDecorator(createDecorator(InvalidateRedirectsCacheUseCase));
        container.registerDecorator(createDecorator(ListRedirectsUseCase));
        container.registerDecorator(createDecorator(MoveRedirectUseCase));
    }
});
