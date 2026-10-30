import { Route } from "@webiny/app-admin";

// The Reviewer exclusions page under Settings > Workflows, one route for every app (R330).
export const ExclusionsRoute = new Route({
    name: "Workflows/Settings/Exclusions",
    path: "/settings/workflows/exclusions"
});
