const { createHandler } = require("@webiny/api-web-server");
const { files, indexHtml } = require("@webiny/api-web-server");
module.exports.handler = createHandler(files({ fileLoader: fs }), indexHtml({ fileLoader: fs }));
