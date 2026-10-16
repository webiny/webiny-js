import React from "react";
import type { RenderResult } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { renderWithAdminUi } from "./renderWithAdminUi.js";

// Renders inside `AdminUiProvider` and a DI container, for components that call `useFeature`.
export const renderWithContainer = (ui: React.ReactElement, container: Container): RenderResult => {
    return renderWithAdminUi(<DiContainerProvider container={container}>{ui}</DiContainerProvider>);
};
