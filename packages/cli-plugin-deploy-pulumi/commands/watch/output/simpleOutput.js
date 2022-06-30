module.exports = {
    type: "watch-output",
    name: "watch-output-terminal",
    log({ message }) {
        console.log(message);
    }
};
