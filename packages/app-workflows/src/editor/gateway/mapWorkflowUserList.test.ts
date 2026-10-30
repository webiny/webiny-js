import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapWorkflowUserList } from "./mapWorkflowUserList.js";
import { createWorkflowUserDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserListDto } from "~/editor/testing/editorFixtures.js";

describe("mapWorkflowUserList", () => {
    it("maps every user with its id, display name and team ids and keeps the missing ids", () => {
        const dto = createWorkflowUserListDto({
            users: [
                createWorkflowUserDto({
                    id: "user-1",
                    displayName: "Ivan Horvat",
                    teamIds: ["team-1", "team-2"]
                }),
                createWorkflowUserDto({ id: "user-2", displayName: "Maja Kos", teamIds: [] })
            ],
            missingIds: ["user-gone"]
        });

        expect(mapWorkflowUserList(dto)).toEqual({
            users: [
                { id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1", "team-2"] },
                { id: "user-2", displayName: "Maja Kos", teamIds: [] }
            ],
            missingIds: ["user-gone"]
        });
    });

    it("keeps the order the server returned", () => {
        const dto = createWorkflowUserListDto({
            users: [
                createWorkflowUserDto({ id: "user-b", displayName: "Bea" }),
                createWorkflowUserDto({ id: "user-a", displayName: "Ana" })
            ]
        });

        const ids = mapWorkflowUserList(dto).users.map(user => user.id);

        expect(ids).toEqual(["user-b", "user-a"]);
    });

    it("maps an absent teamIds to an empty list", () => {
        const user = createWorkflowUserDto({ id: "user-1" });
        Reflect.deleteProperty(user, "teamIds");

        const dto = createWorkflowUserListDto({ users: [user] });

        const result = mapWorkflowUserList(dto);

        expect(result.users[0].teamIds).toEqual([]);
    });

    it("maps an empty answer to empty lists", () => {
        const dto = createWorkflowUserListDto({ users: [], missingIds: [] });

        const result = mapWorkflowUserList(dto);

        expect(result).toEqual({ users: [], missingIds: [] });
    });

    it("does not share the arrays of the DTO", () => {
        const dto = createWorkflowUserListDto({
            users: [createWorkflowUserDto({ teamIds: ["team-1"] })],
            missingIds: ["user-gone"]
        });

        const result = mapWorkflowUserList(dto);

        expect(result.users[0].teamIds).not.toBe(dto.users[0].teamIds);
        expect(result.missingIds).not.toBe(dto.missingIds);
    });
});
