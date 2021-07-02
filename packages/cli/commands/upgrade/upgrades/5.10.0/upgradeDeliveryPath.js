const { replaceInPath } = require("replace-in-path");
const path = require("path");

const upgradeDeliveryPath = ({ context }) => {
    const { info } = context;
    info(`Updating ${info.hl("delivery")} CloudFront distribution's cache behaviours...`);

    const replacement = {
        find: `pathPattern: "\\/static-\\*"`,
        replaceWith: `pathPattern: "/static/*"`
    };

    replaceInPath(path.join(context.project.root, "apps", "site", "**/*.ts"), replacement);
    replaceInPath(path.join(context.project.root, "apps", "website", "**/*.ts"), replacement);
};

module.exports = {
    upgradeDeliveryPath
};
