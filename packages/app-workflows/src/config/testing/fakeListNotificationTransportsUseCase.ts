import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListNotificationTransportsUseCase } from "~/config/useCases/listNotificationTransports/abstractions.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";

export interface FakeListNotificationTransportsUseCase
    extends ListNotificationTransportsUseCase.Interface {
    execute: Mock<ListNotificationTransportsUseCase.Interface["execute"]>;
}

// The e-mail transport; tests override the answer.
export const createFakeListNotificationTransportsUseCase =
    (): FakeListNotificationTransportsUseCase => {
        const email = createNotificationTransport();
        const transports: NotificationTransport[] = [email];
        return { execute: vi.fn().mockResolvedValue(transports) };
    };
