import { TeamFactory } from "webiny/api/security";

class MyTeamImpl implements TeamFactory.Interface {
    async execute(): TeamFactory.Return {
        return [
            {
                name: "Content Team",
                slug: "content-team",
                description: "Team responsible for content management",
                roles: ["content-editor"]
            }
        ];
    }
}

export default TeamFactory.createImplementation({
    implementation: MyTeamImpl,
    dependencies: []
});
