import { describe, expect, it } from "vitest";
import * as ui from "~/exports/admin/ui.js";
import { OverlayLayout } from "~/components/OverlayLayout/index.js";
import { DialogsProvider } from "~/components/index.js";
import { useConfirmationDialog } from "~/hooks/index.js";

describe("public admin exports", () => {
    it("export the UI pieces as their source symbols", () => {
        expect(ui.OverlayLayout).toBe(OverlayLayout);
        expect(ui.DialogsProvider).toBe(DialogsProvider);
        expect(ui.useConfirmationDialog).toBe(useConfirmationDialog);
    });
});
