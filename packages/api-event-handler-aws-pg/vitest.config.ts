import { createTestConfig } from "../../testing";

// Self-contained: the tests start their own Postgres (PGlite), so no storage preset applies.
export default async () => {
    return createTestConfig({ path: import.meta.dirname });
};
