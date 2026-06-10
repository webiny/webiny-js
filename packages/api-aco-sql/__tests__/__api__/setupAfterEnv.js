import { beforeEach } from "vitest";

beforeEach(() => {
    const managers = globalThis.__acoSqlManagers || [];
    for (const manager of managers) {
        manager.reset();
    }
});
