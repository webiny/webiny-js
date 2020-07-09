const os = require("os");
const { dim } = require("chalk");
const stripAnsi = require("strip-ansi");
const figures = require("figures");
const ansiEscapes = require("ansi-escapes");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class Status {
    constructor() {
        this.seconds = 0;
        this.status = {
            message: "Deploying"
        };
        this.status.running = false;
    }

    isRunning() {
        return this.status.running;
    }

    start() {
        // Hide cursor always, to keep it clean
        process.stdout.write(ansiEscapes.cursorHide);
        this.status.running = true;

        this.renderInterval = setInterval(async () => {
            this.render();
            await sleep(100);
            if (this.isRunning()) {
                this.render();
            }
        }, 100);

        // Count seconds
        setInterval(() => {
            this.seconds++;
        }, 1000);
    }

    stop(reason) {
        if (!this.isRunning()) {
            return;
        }

        return this.statusEngineStop(reason);
    }

    statusEngineStop(reason) {
        this.status.running = false;

        // Clear any existing content
        process.stdout.write(ansiEscapes.cursorLeft);
        process.stdout.write(ansiEscapes.eraseDown);

        // Write content
        console.log();
        const content = `${dim(this.seconds + "s")} ${dim(figures.pointerSmall)} Deploying...`;
        process.stdout.write("  " + content);

        // Put cursor to starting position for next view
        console.log(os.EOL);
        process.stdout.write(ansiEscapes.cursorLeft);
        process.stdout.write(ansiEscapes.cursorShow);
    }

    async render(status) {
        // Start Status engine, if it isn't running yet
        if (!this.isRunning()) {
            this.start();
        }

        // Set global status
        if (status) {
            this.status.message = status;
        }

        // Clear any existing content
        process.stdout.write(ansiEscapes.eraseDown);

        // Write content
        console.log();
        const content = `${dim(this.seconds + "s")} ${dim(figures.pointerSmall)} ${
            this.status.message
        }...`;
        process.stdout.write("  " + content);
        console.log();

        // Get cursor starting position according to terminal & content width
        const startingPosition = this.getRelativeVerticalCursorPosition(content);

        // Put cursor to starting position for next view
        process.stdout.write(ansiEscapes.cursorUp(startingPosition));
        process.stdout.write(ansiEscapes.cursorLeft);
    }

    getRelativeVerticalCursorPosition(contentString) {
        const base = 1;
        const terminalWidth = process.stdout.columns;
        const contentWidth = stripAnsi(contentString).length;
        const nudges = Math.ceil(Number(contentWidth) / Number(terminalWidth));
        return base + nudges;
    }

    clearStatus() {
        clearInterval(this.renderInterval);
        this.status.running = false;
        process.stdout.write(ansiEscapes.cursorLeft);
        process.stdout.write(ansiEscapes.eraseDown);
        process.stdout.write(ansiEscapes.cursorShow);
    }
}

module.exports = { Status };
