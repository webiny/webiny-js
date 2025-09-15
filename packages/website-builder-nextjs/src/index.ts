export * from "@webiny/website-builder-react";

import { setHeadersProvider } from "@webiny/website-builder-react";

setHeadersProvider(async () => {
    // Settings @ts-expect-error breaks the build if the dependency is installed in the repo.
    // @ts-ignore This is a peer dependency.
    // eslint-disable-next-line import/dynamic-import-chunkname
    const { headers } = await import("next/headers.js");
    return await headers();
});
