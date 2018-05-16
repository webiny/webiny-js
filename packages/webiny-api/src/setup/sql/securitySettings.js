const data = {
    entities: {
        File: { group: { operations: {} }, other: { operations: {} }, owner: { operations: {} } },
        Image: { group: { operations: {} }, other: { operations: {} }, owner: { operations: {} } },
        update: { undefined: { operations: { owner: true } } },
        CmsPage: { group: { operations: {} }, other: { operations: {} } },
        SecurityUser: {
            group: { operations: {} },
            other: { operations: { read: true } },
            owner: { operations: { read: true, update: true } }
        },
        SecurityGroup: {
            group: { operations: {} },
            other: { operations: { read: true } },
            owner: { operations: {} }
        },
        SecuritySettings: { owner: { operations: {} } }
    }
};

export default `INSERT INTO \`Settings\` (\`id\`, \`deleted\`, \`key\`, \`data\`) VALUES ('5af92fb446e6daa0f8150ccc', 0, 'webiny-api-security', '${JSON.stringify(
    data
)}');`;
