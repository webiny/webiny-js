const blessed = require("blessed");
const contrib = require("blessed-contrib");
const stripAnsi = require("strip-ansi");

let output;

module.exports = {
    type: "watch-output",
    name: "watch-output-terminal",
    initialize: args => {
        output = createScreen(args);
    },
    log({ type, message }) {
        if (typeof message !== "string") {
            return;
        }

        message
            .split("\n")
            .filter(line => {
                // There are lines that only contain ANSI color / style codes and nothing else.
                // Naturally, we don't need these to be displayed in user's terminal. That's why,
                // before doing the string trim, we're also stripping any potential ANSI codes.
                const lineWithoutAnsi = stripAnsi(line);
                return lineWithoutAnsi.trim().length > 0;
            })
            .forEach(item => {
                output.logs[type]?.log(item);
            });
    },
    exit() {
        output.screen.destroy();
    }
};

const createScreen = args => {
    // If we only need a single pane, then we don't need to instantiate panes-layout with blessed at all.
    const singlePane = !!args.build + !!args.deploy + !!args.remoteRuntimeLogs === 1;
    if (singlePane) {
        const log = console.log;
        return {
            screen: null,
            grid: null,
            logs: { build: { log }, deploy: { log }, logs: { log } }
        };
    }

    // Setup blessed screen.
    const screen = blessed.screen({
        smartCSR: true,
        useBCE: true,
        dockBorders: true
    });

    const HEIGHTS = {
        build: 2,
        deploy: 1,
        logs: 2
    };

    const output = { screen, grid: null, logs: { build: null, deploy: null, logs: null } };

    // Calculate total rows needed.
    let rows = { total: 0, current: 0 };
    if (args.build) {
        rows.total += HEIGHTS.build;
    }

    if (args.deploy) {
        rows.total += HEIGHTS.deploy;
    }

    if (args.remoteRuntimeLogs) {
        rows.total += HEIGHTS.logs;
    }

    // Create grid.
    output.grid = new contrib.grid({ rows: rows.total, cols: 1, screen: screen });

    if (args.build) {
        output.logs.build = output.grid.set(rows.current, 0, HEIGHTS.build, 1, contrib.log, {
            label: "Build",
            scrollOnInput: true,
            bufferLength: 90
        });
        rows.current += HEIGHTS.build;
    }

    if (args.deploy) {
        output.logs.deploy = output.grid.set(rows.current, 0, HEIGHTS.deploy, 1, contrib.log, {
            label: "Deploy",
            scrollOnInput: true,
            bufferLength: 90
        });
        rows.current += HEIGHTS.deploy;
    }

    if (args.remoteRuntimeLogs) {
        output.logs.logs = output.grid.set(rows.current, 0, HEIGHTS.logs, 1, contrib.log, {
            label: "Logs",
            scrollOnInput: true,
            bufferLength: 90
        });
        rows.current += HEIGHTS.logs;
    }

    output.screen.render();

    return output;
};
