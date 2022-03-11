/* eslint-disable */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function () {
    if (global["window"]) {
        var hyperform = require("hyperform");
        hyperform(window);
        Object.defineProperty(window["HTMLElement"].prototype, "dataset", {
            writable: true,
            value: {}
        });
        if (!window["HTMLCanvasElement"]) {
            Object.defineProperty(window["HTMLCanvasElement"].prototype, "getContext", {
                writable: true,
                value: function () {
                    return {
                        font: "",
                        measureText: function () {
                            return { width: 0 };
                        }
                    };
                }
            });
        }
        if (!window.scrollTo) {
            Object.defineProperty(window, "scrollTo", {
                writable: true,
                value: function () {}
            });
        }
        window["MutationObserver"] = window["MutationObserver"] || require("mutation-observer");
    }
};
