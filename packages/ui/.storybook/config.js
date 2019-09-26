import { configure } from "@storybook/react";
import "./../src/index.scss";

// automatically import all files ending in *.stories.js
const req = require.context("../src", true, /.stories.js$/);
function loadStories() {
    req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);

// Configure fontawesome
//import fontawesome from "@fortawesome/fontawesome";
//import solid from "@fortawesome/fontawesome-free-solid";
//fontawesome.library.add(solid);
