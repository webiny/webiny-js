const apiI18n = require("./packages/api-i18n/jest-dynamodb-config");
const merge = require("lodash/merge");
const path = require("path");
const os = require("os");

module.exports = merge(
    {
        installerConfig: {
            installPath: path.join(os.tmpdir(), "dynamodb_local_2020-05-19"),
            downloadUrl:
                "https://s3-us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_2020-05-19.tar.gz"
        }
    },
    apiI18n
);
