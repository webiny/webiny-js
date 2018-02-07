import { Entity } from "webiny-api";
import { MemoryDriver } from "webiny-entity-memory";
import { EntityCollection } from "webiny-entity";
import Authorization from "../src/services/authorization";
import MyUser from "./entities/myUser";
import passwordAttr from "../src/attributes/passwordAttribute";
import chai from "./chai";
import { Class1, Class2, Class3 } from "./authorization/endpoints";

const { expect } = chai;

describe("Authorization test", () => {
    let auth: Authorization = null;

    before(() => {
        // Create Authentication service
        auth = new Authorization();
        // Register password attribute
        passwordAttr();
        // Configure Memory entity driver
        const memoryDriver = new MemoryDriver();
        Entity.driver = memoryDriver;

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

        memoryDriver.import("MyUser2Role", [
            {
                id: "1",
                identity: "user1",
                role: "role1",
                deleted: false
            },
            {
                id: "2",
                identity: "user1",
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

        // TODO: finish this in Identity class
        memoryDriver.import("Security.RoleGroup", [
            {
                id: "roleGroup1",
                name: "roleGroup1",
                slug: "roleGroup1",
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
                roleGroup: "permission1",
                deleted: false
            },
            {
                id: "2",
                role: "role1",
                roleGroup: "permission4",
                deleted: false
            },
            {
                id: "3",
                role: "role2",
                roleGroup: "permission2",
                deleted: false
            },
            {
                id: "4",
                role: "role2",
                roleGroup: "permission3",
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
    });

    it("Should return collection of roles", async () => {
        let user = null;

        try {
            user = await MyUser.findById("user1");
        } catch (e) {
            const a = 123;
        }

        const b = 123;
        const roles = await user.getRoles();
        expect(roles).to.be.instanceof(EntityCollection);
        console.log(await roles.toJSON("id,slug"));
    });
    -it("Should confirm that identity has a role", async () => {
        const user = await MyUser.findById("user1");
        expect(await user.hasRole("role1")).to.be.true;
    });

    it("Should confirm that identity doesn't have a role", async () => {
        const user = await MyUser.findById("user1");
        return expect(user.hasRole("no-role")).to.become(false);
    });

    it("Should correctly check execution permissions", async () => {
        const user = await MyUser.findById("user1");
        const endpoint1 = new Class1();
        const endpoint2 = new Class2();
        const endpoint3 = new Class3();
        const apiMethod1 = endpoint1.getApi().getMethod("method1");
        const apiMethod2 = endpoint2.getApi().getMethod("method2");
        const apiMethod5 = endpoint3.getApi().getMethod("method5");
        return Promise.all([
            expect(auth.canExecute(apiMethod1, user)).to.become(true),
            expect(auth.canExecute(apiMethod5, user)).to.become(true),
            expect(auth.canExecute(apiMethod2, user)).to.become(false)
        ]);
    });
});
