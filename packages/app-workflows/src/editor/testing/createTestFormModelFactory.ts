import { Container } from "@webiny/di";
import { FormModelFactory } from "@webiny/app-admin";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";

// The real FormModel factory in a throw-away container, as the FormModel tests build it.
export const createTestFormModelFactory = (): FormModelFactory.Interface => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    return container.resolve(FormModelFactory);
};
