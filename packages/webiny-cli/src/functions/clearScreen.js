const windows = process.platform.indexOf("win") === 0;

module.exports.clearScreen = () => {
    let i, lines;
    let stdout = "";

    if (windows === false) {
        stdout += "\x1B[2J";
    } else {
        lines = process.stdout.getWindowSize()[1];

        for (i = 0; i < lines; i++) {
            stdout += "\r\n";
        }
    }

    // Reset cursur
    stdout += "\x1B[0f";

    process.stdout.write(stdout);
};
