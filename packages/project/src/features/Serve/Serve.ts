import { createImplementation } from "@webiny/di";
import { Serve } from "~/abstractions/index.js";

/**
 * Base (flavour-agnostic) Serve implementation. There is no cloud-agnostic notion of "serving" a
 * built app — the AWS flavour deploys, it doesn't serve locally — so this default refuses. Flavours
 * that DO support serving (e.g. the self-hosted server flavour) replace this implementation.
 */
export class DefaultServe implements Serve.Interface {
    async execute(): Promise<Serve.Result> {
        throw new Error(`The "serve" command is not supported in this project flavour.`);
    }
}

export const serve = createImplementation({
    abstraction: Serve,
    implementation: DefaultServe,
    dependencies: []
});
