import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";

// The app name next to a widget title: each app registers its own pair of widgets (R231).
export const WIDGET_APP_LABELS: Record<WorkflowAppKind, string> = {
    cms: "Headless CMS",
    wb: "Website Builder"
};
