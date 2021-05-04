/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Updated to work with Webpack 5 by Webiny.
 */

"use strict";

const os = require("os");
const codeFrame = require("@babel/code-frame").codeFrameColumns;
const chalk = require("chalk");
const fs = require("fs");

const issueOrigins = {
    typescript: "TypeScript",
    internal: "fork-ts-checker-webpack-plugin"
};

function formatter(issue) {
    const {
        origin,
        severity,
        file,
        location: { start },
        message,
        code
    } = issue;

    const colors = new chalk.Instance();
    const messageColor = severity === "warning" ? colors.yellow : colors.red;
    const fileAndNumberColor = colors.bold.cyan;

    const source = file && fs.existsSync(file) && fs.readFileSync(file, "utf-8");
    const frame = source
        ? codeFrame(source, { start })
              .split("\n")
              .map(str => "  " + str)
              .join(os.EOL)
        : "";

    return [
        messageColor.bold(`${issueOrigins[origin]} ${severity.toLowerCase()} in `) +
            fileAndNumberColor(`${file}(${start.line},${start.column})`) +
            messageColor(":"),
        message + "  " + messageColor.underline(`TS${code}`),
        "",
        frame
    ].join(os.EOL);
}

module.exports = formatter;
