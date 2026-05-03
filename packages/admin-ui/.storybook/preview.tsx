import React from "react";
import type { Preview } from "@storybook/react-webpack5";
import { AdminUiProvider } from "../src/AdminUiProvider/AdminUiProvider.js";

import "../src/theme.css";

const preview: Preview = {
    parameters: {
        layout: "centered",
        docs: { toc: { headingSelector: "h2, h3, h4" } }
    },
    decorators: [
        Story => (
            <AdminUiProvider>
                <Story />
            </AdminUiProvider>
        )
    ]
};

export default preview;
