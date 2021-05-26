const blessed = require("blessed");
const contrib = require("blessed-contrib");

let output;

module.exports = {
    type: "watch-output",
    name: "watch-output-terminal",
    initialize: args => {
        output = createScreen(args);
        output.screen.render();
    },
    log({ type, message }) {
        message
            .split("\n")
            .filter(Boolean)
            .forEach(item => {
                output.logs[type].log(item);
            });
    },
    exit() {
        output.screen.destroy();
    }
};

const createScreen = args => {
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

    if (args.logs) {
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

    if (args.logs) {
        output.logs.logs = output.grid.set(rows.current, 0, HEIGHTS.logs, 1, contrib.log, {
            label: "Logs",
            scrollOnInput: true,
            bufferLength: 90
        });
        rows.current += HEIGHTS.logs;
    }

    return output;
};
