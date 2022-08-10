const { createDynaliteTables } = require("../../jest.config.base");

module.exports = createDynaliteTables({
    data: [
        {
            PK: "T#root",
            SK: "A",
            GSI1_PK: "TENANTS",
            GSI1_SK: "T#null#3000-01-01T00:00:00.000Z",
            data:{
                "id": "root",
                "name": "Root",
                "description": "The top-level Webiny tenant.",
                "parent": null,
                "status": "active",
                "settings": {
                    "domains": []
                },
                "savedOn": "3000-01-01T00:00:00.000Z",
                "createdOn": "3000-01-01T00:00:00.000Z",
                "webinyVersion": "5.3000.0"
            }
        },
        {
            "PK": "T#root#SYSTEM",
            "SK": "SECURITY",
            "tenant": "root",
            "createdOn": "3000-01-01T00:00:00.000Z",
            "version": "5.3000.0",
            "_ct": "3000-01-01T00:00:00.000Z",
            "_et": "SecuritySystem",
            "_md": "3000-01-01T00:00:00.000Z"
        }
    ]
});
