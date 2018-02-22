export default memoryDriver => {
    // Test data
    memoryDriver.import("MyUser", [
        {
            id: "user1",
            username: "user1",
            password: "pass1",
            deleted: false
        },
        {
            id: "user2",
            username: "user2",
            password: "pass2",
            deleted: false
        }
    ]);

    memoryDriver.import("Security.Identity2Role", [
        {
            id: "1",
            identity: "MyUser:user1",
            role: "role1",
            deleted: false
        },
        {
            id: "2",
            identity: "MyUser:user1",
            role: "role2",
            deleted: false
        }
    ]);

    memoryDriver.import("Security.Role", [
        {
            id: "role1",
            name: "role1",
            slug: "role1",
            deleted: false
        },
        {
            id: "role2",
            name: "role2",
            slug: "role2",
            deleted: false
        }
    ]);

    memoryDriver.import("Security.RoleGroup", [
        {
            id: "roleGroup1",
            name: "roleGroup1",
            slug: "roleGroup1",
            deleted: false
        }
    ]);

    memoryDriver.import("Security.Identity2RoleGroup", [
        {
            id: "1",
            identity: "MyUser:user1",
            roleGroup: "roleGroup1",
            deleted: false
        }
    ]);

    memoryDriver.import("Security.Permission", [
        {
            id: "perm1",
            name: "perm1",
            slug: "perm1",
            deleted: false,
            rules: [
                {
                    classId: "class1",
                    methods: [
                        {
                            method: "method1"
                        },
                        {
                            method: "method2"
                        }
                    ]
                }
            ]
        },
        {
            id: "perm2",
            name: "perm2",
            slug: "perm2",
            deleted: false,
            rules: [
                {
                    classId: "class2",
                    methods: [
                        {
                            method: "method1"
                        },
                        {
                            method: "method3"
                        }
                    ]
                }
            ]
        },
        {
            id: "perm3",
            name: "perm3",
            slug: "perm3",
            deleted: false,
            rules: [
                {
                    classId: "class3",
                    methods: [
                        {
                            method: "method4"
                        },
                        {
                            method: "method5"
                        }
                    ]
                }
            ]
        },
        {
            id: "perm4",
            name: "perm4",
            slug: "perm4",
            deleted: false,
            rules: [
                {
                    classId: "class1",
                    methods: [
                        {
                            method: "method2"
                        }
                    ]
                },
                {
                    classId: "class3",
                    methods: [
                        {
                            method: "method2"
                        },
                        {
                            method: "method3"
                        }
                    ]
                }
            ]
        }
    ]);

    memoryDriver.import("Security.Role2Permission", [
        {
            id: "1",
            role: "role1",
            permission: "perm1",
            deleted: false
        },
        {
            id: "2",
            role: "role1",
            permission: "perm4",
            deleted: false
        },
        {
            id: "3",
            role: "role2",
            permission: "perm2",
            deleted: false
        },
        {
            id: "4",
            role: "role2",
            permission: "perm3",
            deleted: false
        }
    ]);

    memoryDriver.import("Security.Role2RoleGroup", [
        {
            id: "1",
            role: "role1",
            roleGroup: "roleGroup1",
            deleted: false
        },
        {
            id: "2",
            role: "role2",
            roleGroup: "roleGroup1",
            deleted: false
        }
    ]);
};
