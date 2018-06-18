const fs = require("fs");
const path = require("path");

module.exports = () => {
    return {
        visitor: {
            ImportDeclaration({ node }, state) {
                const dirname = path.dirname(state.file.opts.filename);
                const src = node.source.value;
                if (src.includes("styles.")) {
                    if (!src.includes("extract")) {
                        node.source.value = src
                            .replace("styles.", "styles.module.")
                            .split("?")
                            .shift();
                        const fileName = src.split("?").shift();
                        const from = path.resolve(dirname, fileName);
                        const to = path.resolve(dirname, node.source.value);
                        fs.rename(from, to, function(err) {
                            if (err) console.log("ERROR: " + err);
                        });
                    } else {
                        node.source.value = src.split("?").shift();
                    }
                }
            }
        }
    };
};
