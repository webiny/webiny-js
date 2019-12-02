module.exports = {
    name: "site-fn",
    plugins: ["aws-lambda"],
    webpack: ({ setEntry, setOutput }) => {
        setEntry("handler.js");
        setOutput("handler.js");
    }
};
