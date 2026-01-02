import { LoginGraphQLFieldSelection } from "./abstractions.js";

class LoginFieldSelectionCompositeImpl implements LoginGraphQLFieldSelection.Interface {
    constructor(private selections: LoginGraphQLFieldSelection.Interface[]) {}

    getSelection(): string[] {
        return this.selections.flatMap(selection => selection.getSelection());
    }
}

export const LoginFieldSelectionComposite = LoginGraphQLFieldSelection.createComposite({
    implementation: LoginFieldSelectionCompositeImpl,
    dependencies: [[LoginGraphQLFieldSelection, { multiple: true }]]
});
