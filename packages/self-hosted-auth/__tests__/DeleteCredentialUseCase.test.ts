import { describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import type { StorageCredential } from "~/api/storage/credentials/index.js";
import { CredentialsRepositoryFeature } from "~/api/repositories/CredentialsRepository.js";
import { DeleteCredentialFeature } from "~/api/features/DeleteCredential/index.js";
import { DeleteCredentialUseCase } from "~/api/features/DeleteCredential/index.js";
import { createInMemoryCredentials } from "./helpers/inMemoryCredentials.js";

const credential: StorageCredential = {
    userId: "user-123",
    email: "admin@example.com",
    passwordHash: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
    createdOn: "2026-01-01T00:00:00.000Z",
    updatedOn: "2026-01-01T00:00:00.000Z"
};

const setup = (options: { deleteThrows?: boolean } = {}) => {
    const container = new Container();

    const overrides = options.deleteThrows
        ? {
              delete: () => {
                  throw new Error("the database is on fire");
              }
          }
        : {};

    const credentials = createInMemoryCredentials([credential], overrides);
    credentials.register(container);

    CredentialsRepositoryFeature.register(container);
    DeleteCredentialFeature.register(container);

    return { useCase: container.resolve(DeleteCredentialUseCase), rows: credentials.rows };
};

describe("DeleteCredentialUseCase", () => {
    it("removes the stored password", async () => {
        const { useCase, rows } = setup();

        const result = await useCase.execute({ userId: "user-123" });

        expect(result.isFail()).toBe(false);
        expect(rows).toHaveLength(0);
    });

    it("says nothing went wrong when there was nothing to remove", async () => {
        const { useCase } = setup();

        const result = await useCase.execute({ userId: "nobody" });

        expect(result.isFail()).toBe(false);
    });

    /**
     * The reason the installer calls this rather than the repository: a credential left behind
     * still holds its address, and the address is unique, so the next install using it would fail
     * on a constraint. The caller has to be able to see that happen.
     */
    it("reports a store it could not reach", async () => {
        const { useCase } = setup({ deleteThrows: true });

        const result = await useCase.execute({ userId: "user-123" });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("CREDENTIALS_PERSISTENCE_ERROR");
    });
});
