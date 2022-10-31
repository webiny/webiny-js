import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityTeam";
import { mergeSecurityPermissions } from "@webiny/api-security/createSecurity/mergeSecurityPermissions";

describe("Security Team CRUD Test", () => {
    const { install, securityTeam } = useGqlHandler();

    beforeEach(async () => {
        await install.install();
    });

    test("if a full access permission is found, all other needs to be discarded", async () => {
        const result = mergeSecurityPermissions([
            { something: "custom" },
            { name: "custom" },
            { name: "content.i18n", locales: ["en-US"] },
            { name: "pb.*" },
            { name: "fb.form" },
            { name: "fm.file", own: true, rwd: "rwd" },
            { name: "fm.settings" },
            { name: "cms.*" },
            { name: "cms.endpoint.read" },
            { name: "cms.endpoint.manage" },
            { name: "cms.endpoint.preview" },
            { name: "cms.contentModel", own: true, rwd: "rwd", pw: "" },
            { name: "cms.contentModelGroup", own: false, rwd: "r", pw: "", groups: {} },
            { name: "cms.contentEntry", own: true, rwd: "rwd", pw: "p" },
            { name: "security.*" },
            { name: "security.group" },
            { name: "security.apiKey" },
            { name: "adminUsers.*" },
            { name: "i18n.*" },
            { name: "*" }
        ]);

        expect(result).toEqual([{ name: "*" }]);
    });

    test("if a namespace full access permission is found, all other namespaced permissions needs to be discarded", async () => {
        const result = mergeSecurityPermissions([
            { something: "custom" },
            { name: "custom" },
            { name: "content.i18n", locales: ["en-US"] },
            { name: "pb.*" },
            { name: "fb.form" },
            { name: "fm.file", own: true, rwd: "rwd" },
            { name: "fm.settings" },
            { name: "cms.*" },
            { name: "cms.endpoint.read" },
            { name: "cms.endpoint.manage" },
            { name: "cms.endpoint.preview" },
            { name: "cms.contentModel", own: true, rwd: "rwd", pw: "" },
            { name: "cms.contentModelGroup", own: false, rwd: "r", pw: "", groups: {} },
            { name: "cms.contentEntry", own: true, rwd: "rwd", pw: "p" },
            { name: "security.*" },
            { name: "security.group" },
            { name: "security.apiKey" },
            { name: "adminUsers.*" },
            { name: "i18n.*" }
        ]);

        expect(result).toEqual([
            { name: "i18n.*" },
            { name: "adminUsers.*" },
            { name: "security.*" },
            { name: "cms.*" },
            { name: "pb.*" },
            { locales: ["en-US"], name: "content.i18n" },
            { something: "custom" }
        ]);
    });

    test("if a content.i18n permission is found, locales array must contain a distinct list of all encountered locales", async () => {
        const result = mergeSecurityPermissions([
            { something: "custom" },
            { name: "custom" },
            { name: "content.i18n", locales: ["en-US"] },
            { name: "content.i18n", locales: ["en-US", "de-DE", "it-IT"] },
            { name: "pb.*" },
            { name: "fb.form" },
            { name: "content.i18n", locales: ["de-DE"] },
            { name: "fm.file", own: true, rwd: "rwd" },
            { name: "content.i18n", locales: ["it-IT"] }
        ]);

        expect(result).toEqual([
            {
                locales: ["it-IT", "de-DE", "en-US"],
                name: "content.i18n"
            },
            {
                name: "pb.*"
            },
            {
                something: "custom"
            }
        ]);
    });

    // test("should able to create, read, update and delete `Security Teams`", async () => {
    //     const [responseA] = await securityTeam.create({ data: mocks.teamA });
    //
    //     // Let's create two teams.
    //     const teamA = responseA.data.security.createTeam.data;
    //     expect(teamA).toEqual({ id: teamA.id, ...mocks.teamA });
    //
    //     const [responseB] = await securityTeam.create({ data: mocks.teamB });
    //
    //     const teamB = responseB.data.security.createTeam.data;
    //     expect(teamB).toEqual({ id: teamB.id, ...mocks.teamB });
    //
    //     // Let's check whether both of the team exists
    //     const [listResponse] = await securityTeam.list();
    //
    //     expect(listResponse.data.security.listTeams).toEqual(
    //         expect.objectContaining({
    //             data: expect.arrayContaining([
    //                 {
    //                     name: expect.any(String),
    //                     description: expect.any(String),
    //                     slug: expect.stringMatching(/anonymous|full-access|team-a|team-b/),
    //                     permissions: expect.any(Array)
    //                 }
    //             ]),
    //             error: null
    //         })
    //     );
    //
    //     // Let's update the "teamB" name
    //     const updatedName = "Team B - updated";
    //     const [updateB] = await securityTeam.update({
    //         id: teamB.id,
    //         data: {
    //             name: updatedName,
    //             permissions: mocks.teamB.permissions
    //         }
    //     });
    //
    //     expect(updateB).toEqual({
    //         data: {
    //             security: {
    //                 updateTeam: {
    //                     data: {
    //                         ...mocks.teamB,
    //                         name: updatedName
    //                     },
    //                     error: null
    //                 }
    //             }
    //         }
    //     });
    //
    //     // Let's delete  "teamB"
    //     const [deleteB] = await securityTeam.delete({
    //         id: teamB.id
    //     });
    //
    //     expect(deleteB).toEqual({
    //         data: {
    //             security: {
    //                 deleteTeam: {
    //                     data: true,
    //                     error: null
    //                 }
    //             }
    //         }
    //     });
    //
    //     // Should not contain "teamB"
    //     const [getB] = await securityTeam.get({ id: teamB.id });
    //
    //     expect(getB).toMatchObject({
    //         data: {
    //             security: {
    //                 getTeam: {
    //                     data: null,
    //                     error: {
    //                         code: "NOT_FOUND",
    //                         data: null
    //                     }
    //                 }
    //             }
    //         }
    //     });
    //
    //     // Should contain "teamA" by slug
    //     const [getA] = await securityTeam.get({ id: teamA.id });
    //
    //     expect(getA).toEqual({
    //         data: {
    //             security: {
    //                 getTeam: {
    //                     data: mocks.teamA,
    //                     error: null
    //                 }
    //             }
    //         }
    //     });
    // });
    //
    // test('should not allow creating a team with same "slug"', async () => {
    //     // Creating a team
    //     await securityTeam.create({ data: mocks.teamA });
    //
    //     // Creating a team with same "slug" should not be allowed
    //     const [response] = await securityTeam.create({ data: mocks.teamA });
    //
    //     expect(response).toEqual({
    //         data: {
    //             security: {
    //                 createTeam: {
    //                     data: null,
    //                     error: {
    //                         code: "TEAM_EXISTS",
    //                         message: `Team with slug "${mocks.teamA.slug}" already exists.`,
    //                         data: null
    //                     }
    //                 }
    //             }
    //         }
    //     });
    // });
});
