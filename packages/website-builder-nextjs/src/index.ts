export * from "@webiny/website-builder-react";
export { DocumentRenderer } from "./DocumentRenderer.js";

import { setHeadersProvider } from "@webiny/website-builder-react";

setHeadersProvider(async () => {
    // Settings @ts-expect-error breaks the build if the dependency is installed in the repo.
    // @ts-ignore This is a peer dependency.
    const { headers } = await import("next/headers.js");
    return await headers();
});
