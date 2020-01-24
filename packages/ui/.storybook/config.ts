// @ts-nocheck
import { configure, addDecorator } from "@storybook/react";
import { withInfo } from "@storybook/addon-info";
import "./../src/styles.scss";

// automatically import all files ending in *.stories.js
function loadStories() {
    addDecorator(
        withInfo({
            inline: true,
            header: false,
            source: false,
            // TableComponent: () => "TABLICA"
        })
    );
    let req = require.context("../src", true, /.stories.tsx$/);
    req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
