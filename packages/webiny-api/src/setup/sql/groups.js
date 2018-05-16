const permissions = {
    security: {
        api: {
            getFile: {},
            listEntities: {
                list: {
                    name: true,
                    classId: true,
                    attributes: { name: true, protected: true },
                    permissions: true
                },
                meta: { count: true, totalCount: true, totalPages: true }
            },
            getSecurityUser: {
                id: true,
                email: true,
                groups: { id: true, name: true, slug: true },
                enabled: true,
                savedOn: true,
                gravatar: true,
                lastName: true,
                createdOn: true,
                firstName: true,
                updatedOn: true
            },
            getSecurityGroup: {
                id: true,
                name: true,
                slug: true,
                savedOn: true,
                createdOn: true,
                updatedOn: true,
                description: true,
                permissions: true
            },
            listSecurityUsers: {
                list: {
                    id: true,
                    email: true,
                    enabled: true,
                    savedOn: true,
                    gravatar: true,
                    lastName: true,
                    password: true,
                    createdOn: true,
                    firstName: true,
                    updatedOn: true
                },
                meta: { count: true, totalCount: true, totalPages: true }
            },
            createSecurityUser: {
                id: true,
                email: true,
                groups: { id: true, name: true, slug: true },
                enabled: true,
                savedOn: true,
                gravatar: true,
                lastName: true,
                createdOn: true,
                firstName: true,
                updatedOn: true
            },
            deleteSecurityUser: true,
            listSecurityGroups: {
                list: {
                    id: true,
                    name: true,
                    slug: true,
                    savedOn: true,
                    createdOn: true,
                    updatedOn: true,
                    description: true,
                    permissions: true
                },
                meta: { count: true, totalCount: true, totalPages: true }
            },
            updateSecurityUser: {
                id: true,
                email: true,
                groups: { id: true, name: true, slug: true },
                enabled: true,
                savedOn: true,
                gravatar: true,
                lastName: true,
                createdOn: true,
                firstName: true,
                updatedOn: true
            },
            updateSecurityGroup: {
                id: true,
                name: true,
                slug: true,
                savedOn: true,
                createdOn: true,
                updatedOn: true,
                description: true,
                permissions: true
            },
            toggleEntityOperationPermission: {
                entity: { name: true, classId: true, attributes: true },
                permissions: { id: true, group: true, other: true, owner: true }
            }
        },
        entities: {
            File: { operations: {} },
            SecurityUser: {
                attributes: {
                    id: { read: true, write: true },
                    email: { read: true, write: true },
                    deleted: {},
                    enabled: { read: true, write: true },
                    savedOn: { read: true },
                    gravatar: { read: true, write: true },
                    lastName: { read: true, write: true },
                    password: { read: true, write: true },
                    createdOn: { read: true },
                    firstName: { read: true, write: true },
                    updatedOn: { read: true }
                },
                operations: { read: true, create: true, delete: true, update: true }
            },
            SecurityGroup: {
                attributes: {
                    id: { read: true, write: true },
                    name: { read: true, write: true },
                    slug: { read: true, write: true },
                    groups: {},
                    deleted: { read: true, write: true },
                    savedBy: { read: true, write: true },
                    savedOn: { read: true, write: true },
                    createdBy: { read: true, write: true },
                    createdOn: { read: true, write: true },
                    updatedBy: { read: true, write: true },
                    updatedOn: { read: true, write: true },
                    description: { read: true, write: true },
                    permissions: { read: true, write: true },
                    savedByClassId: { read: true, write: true },
                    createdByClassId: { read: true, write: true },
                    updatedByClassId: { read: true, write: true }
                },
                operations: { read: true, create: true, delete: true, update: true }
            },
            SecuritySettings: {
                attributes: {
                    id: { read: true },
                    key: { read: true, write: true },
                    data: { read: true, write: true },
                    updatedBy: {}
                },
                operations: { read: true, update: true }
            }
        }
    },
    default: {
        api: {
            getIdentity: true,
            listCmsWidgets: {
                list: { id: true, data: true, type: true, title: true, settings: true },
                meta: { count: true, totalCount: true, totalPages: true }
            },
            loginSecurityUser: {
                token: true,
                identity: {
                    id: true,
                    email: true,
                    groups: { id: true, slug: true },
                    gravatar: true,
                    lastName: true,
                    firstName: true
                },
                expiresOn: true
            }
        }
    }
};

const sql = {};

sql.admin = `INSERT INTO \`Security_Groups\` (\`id\`, \`deleted\`, \`name\`, \`description\`, \`slug\`, \`permissions\`)
VALUES ('5af92fb446e6daa0f8150cce', 0, 'Administrator', 'Administrator account', 'administrator', NULL);`;

sql.security = `INSERT INTO \`Security_Groups\` (\`id\`, \`deleted\`, \`name\`, \`description\`, \`slug\`, \`permissions\`)
VALUES ('5af935db46e6daa441a54cdb', 0, 'Security', 'Manage users and low-level security.', 'security', '${JSON.stringify(
    permissions.security
)}');`;

sql.default = `INSERT INTO \`Security_Groups\` (\`id\`, \`deleted\`, \`name\`, \`description\`, \`slug\`, \`permissions\`)
VALUES ('5af97d8846e6dac8c9a91833', 0, 'Default', 'Default group of all users.', 'default', '${JSON.stringify(
    permissions.default
)}');`;

export default sql;
