import React from "react";
import { render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";

// Renders inside `AdminUiProvider`, which admin-ui components (Alert, Tooltip) require.
export const renderWithAdminUi = (ui: React.ReactElement): RenderResult => {
    return render(<AdminUiProvider>{ui}</AdminUiProvider>);
};
