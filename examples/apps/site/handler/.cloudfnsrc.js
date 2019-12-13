// BABEL_ENV=development DEBUG=fn:* env-cmd -r .env.json -e default,dev cloudfns build handler

const webpack = require("webpack");

module.exports = {
    name: "site-fn",
    plugins: ["aws-lambda"],
    webpack: ({ setEntry, setOutput, addPlugins }) => {
        setEntry("handler.js");
        setOutput("handler.js");
        addPlugins([
            new webpack.DefinePlugin({
                "process.env.GRAPHQL_API_URL": JSON.stringify(process.env.REACT_APP_GRAPHQL_API_URL)
            })
        ]);
    }
};
