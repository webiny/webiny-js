import { Plugin } from "@webiny/plugins/types";
import * as React from "react";

export type AdminWelcomeScreenWidgetPlugin = Plugin & {
    type: "admin-welcome-screen-widget";
    widget: {
        title: string;
        description: string;
        cta: React.ReactNode;
    };
}