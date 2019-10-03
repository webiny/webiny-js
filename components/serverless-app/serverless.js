const { Component } = require("@serverless/core");

class ServerlessApp extends Component {
    async default(inputs = {}) {
        console.log(this);

        console.log(inputs);

        process.exit();
    }
}

module.exports = ServerlessApp;
