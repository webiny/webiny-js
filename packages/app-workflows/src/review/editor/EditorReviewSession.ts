import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { IEditorReviewSession } from "./abstractions.js";
import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";

/*
 * The shared editor session, exported as a plain class: it is never passed to
 * `createImplementation` here. `createImplementation` writes the abstraction and the
 * dependencies onto the class itself, so each app subclasses this class once in its own file and
 * binds the subclass to its own token and use cases.
 */
export class EditorReviewSession implements IEditorReviewSession {
    constructor(
        public readonly presenter: TargetReviewPresenter.Interface,
        public readonly useCases: IReviewUseCases
    ) {}
}
