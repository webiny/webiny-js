import React from "react";
import ReactDOM from "react-dom";
import { JSDOM } from "jsdom";
import debounce from "debounce";
import { Properties, toObject } from "@webiny/react-properties";

async function renderNavigation(element) {
    return new Promise(resolve => {
        const onChange = debounce(value => {
            resolve(toObject(value));
        });

        mount(<Properties onChange={onChange}>{element}</Properties>);
    });
}

function mount(element) {
    const { window } = new JSDOM(`<div id="root"/>`);
    global.window = window;
    global.document = window.document;
    const root = window.document.getElementById("root");
    ReactDOM.render(element, root);
}

async function generateNavigation() {
    const { default: Navigation } = require("./index.tsx");

    const data = await renderNavigation(<Navigation />);

    console.log(JSON.stringify(data));
}

(async () => {
    await generateNavigation();
})();
