import type React from "react";

// An app a role can reach, named and drawn the way the role editor shows it.
export interface AppAccess {
    name: string;
    title: string;
    icon: React.ReactElement | undefined;
    prefix: string;
}
