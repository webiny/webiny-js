import type { Preview } from "@storybook/react-webpack5";

import "../src/theme.css";

const preview: Preview = {
    parameters: {
        layout: "centered",
        docs: { toc: { headingSelector: "h2, h3, h4" } }
    }
};

export default preview;
