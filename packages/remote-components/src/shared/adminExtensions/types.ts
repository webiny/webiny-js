import type { AdminExtensionKind } from "./constants.js";

/** An admin extension as the GraphQL API returns it. */
export interface AdminExtensionDto {
    id: string;
    kind: AdminExtensionKind;
    name: string;
    label: string;
    description: string;
    enabled: boolean;
    runtimeVersion: number;
    source: string;
    savedOn: string;
}
