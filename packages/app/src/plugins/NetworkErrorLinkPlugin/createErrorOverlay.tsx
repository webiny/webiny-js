import React from "react";
import { render } from "react-dom";
import ErrorOverlay from "./ErrorOverlay";

interface Params {
    query: string;
    networkError: Record<string, any>;
}
const createErrorOverlay = (params: Params) => {
    const { query, networkError } = params;
    // If the element already present in DOM, return immediately.
    if (document.getElementById("overlay-root")) {
        return;
    }
    // Create root element to hold React tree.
    const container: HTMLDivElement = document.createElement("div");
    container.id = "overlay-root";
    // Insert root element into body.
    const body: HTMLBodyElement = document.getElementsByTagName("body")[0];
    body.appendChild(container);
    // Mount the ErrorOverlay component into root element.
    render(<ErrorOverlay query={query} networkError={networkError} />, container);
};

export default createErrorOverlay;
