import { RoleFactory } from "webiny/api/security";

class MyRoleImpl implements RoleFactory.Interface {
    async execute(): RoleFactory.Return {
        return [
            {
                name: "Content Editor",
                slug: "content-editor",
                description: "Can manage content entries",
                permissions: [{ name: "cms.*" }]
            }
        ];
    }
}

export default RoleFactory.createImplementation({
    implementation: MyRoleImpl,
    dependencies: []
});
