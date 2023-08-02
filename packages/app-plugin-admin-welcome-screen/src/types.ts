import * as React from "react";
import { Plugin } from "@webiny/plugins/types";

export type AdminWelcomeScreenWidgetPlugin = Plugin & {
    type: "admin-welcome-screen-widget";
    permission?: string;
    widget: {
        title: string;
        description: string;
        cta: React.ReactElement;
    };
};
