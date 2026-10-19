import { ReviewUseCases } from "@webiny/app-workflows/review/useCases/ReviewUseCases.js";
import { WbReviewGateway } from "../WbReviewGateway/abstractions.js";
import { WbReviewUseCases as UseCasesAbstraction } from "./abstractions.js";

/*
 * `createImplementation` stores the abstraction and the dependencies as metadata on the class
 * itself. Both apps bind the one shared `ReviewUseCases`, so each app binds its own subclass;
 * binding the shared class twice would let the second call overwrite the first.
 */
class WbReviewUseCasesImpl extends ReviewUseCases implements UseCasesAbstraction.Interface {}

export const WbReviewUseCases = UseCasesAbstraction.createImplementation({
    implementation: WbReviewUseCasesImpl,
    dependencies: [WbReviewGateway]
});
