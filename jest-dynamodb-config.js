const path = require("path");
const os = require("os");
const apiI18nTables = require("./packages/api-i18n/jest-dynamodb-tables");
const apiSecurityUserManagementTables = require("./packages/api-security-user-management/jest-dynamodb-tables");

module.exports = {
    tables: [...apiI18nTables, ...apiSecurityUserManagementTables],
    installerConfig: {
        installPath: path.join(os.tmpdir(), "dynamodb_local_2020-05-19"),
        downloadUrl:
            "https://s3-us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_2020-05-19.tar.gz"
    }
};
