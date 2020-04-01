const os = require("os");
const { red, green, dim } = require("chalk");
const stripAnsi = require("strip-ansi");
const figures = require("figures");
const ansiEscapes = require("ansi-escapes");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class Status {
    constructor() {
        this.entity = "Webiny";
        this.useTimer = true;
        this.seconds = 0;
        this.status = {};
        this.status.running = false;
        this.status.message = "Running";
        this.status.loadingDots = "";
        this.status.dotsCount = 0;
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

    stop(reason, message) {
        if (!this.isRunning()) {
            console.log();
            process.exit(0);
            return;
        }

        return this.statusEngineStop(reason, message);
    }

    statusEngineStop(reason, message) {
        this.status.running = false;

        if (reason === "error") {
            message = red(message);
        }
        if (reason === "cancel") {
            message = red("canceled");
        }
        if (reason === "done") {
            message = green("done");
        }

        // Clear any existing content
        process.stdout.write(ansiEscapes.cursorLeft);
        process.stdout.write(ansiEscapes.eraseDown);

        // Write content
        console.log();
        let content = " ";
        if (this.useTimer) {
            content += ` ${dim(this.seconds + "s")}`;
            content += ` ${dim(figures.pointerSmall)}`;
        }
        content += ` ${this.entity}`;
        content += ` ${dim(figures.pointerSmall)} ${message}`;
        process.stdout.write(content);

        // Put cursor to starting position for next view
        console.log(os.EOL);
        process.stdout.write(ansiEscapes.cursorLeft);
        process.stdout.write(ansiEscapes.cursorShow);

        if (reason === "error") {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }

    async render(status, entity) {
        // Start Status engine, if it isn't running yet
        if (!this.isRunning()) {
            this.start();
        }

        // Set global status
        if (status) {
            this.status.message = status;
        }

        // Set global status
        if (entity) {
            this.entity = entity;
        }

        // Loading dots
        if (this.status.dotsCount === 0) {
            this.status.loadingDots = `.`;
        } else if (this.status.dotsCount === 2) {
            this.status.loadingDots = `..`;
        } else if (this.status.dotsCount === 4) {
            this.status.loadingDots = `...`;
        } else if (this.status.dotsCount === 6) {
            this.status.loadingDots = "";
        }
        this.status.dotsCount++;
        if (this.status.dotsCount > 8) {
            this.status.dotsCount = 0;
        }

        // Clear any existing content
        process.stdout.write(ansiEscapes.eraseDown);

        // Write content
        console.log();
        let content = " ";
        if (this.useTimer) {
            content += ` ${dim(this.seconds + "s")}`;
            content += ` ${dim(figures.pointerSmall)}`;
        }

        content += ` ${this.entity}`;
        content += ` ${dim(figures.pointerSmall)} ${dim(this.status.message)}`;
        content += ` ${dim(this.status.loadingDots)}`;
        process.stdout.write(content);
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
