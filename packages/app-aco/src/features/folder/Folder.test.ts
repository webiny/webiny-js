import pick from "lodash/pick";
import { CmsIdentity } from "@webiny/app-headless-cms-common/types";
import { FolderGqlDto } from "~/features/folder/createFolder/FolderGqlDto";
import { ICreateFolderGateway } from "~/features/folder/createFolder/ICreateFolderGateway";
import { CreateFolder } from "~/features/folder/createFolder/CreateFolder";

const user1: CmsIdentity = {
    id: "user-1",
    type: "admin",
    displayName: "User 1"
};

const type = "demo-type";

const folder1: FolderGqlDto = {
    id: "folder-1",
    title: "Folder 1",
    slug: "folder-1",
    permissions: [],
    hasNonInheritedPermissions: true,
    canManageContent: true,
    canManagePermissions: true,
    canManageStructure: true,
    type,
    parentId: null,
    createdBy: user1,
    createdOn: new Date().toString(),
    savedBy: user1,
    savedOn: new Date().toString(),
    modifiedBy: null,
    modifiedOn: null
};

const createFolderGateway = ({ execute }: ICreateFolderGateway): ICreateFolderGateway => ({
    execute
});

describe("Folder features", () => {
    it("should be able to create a folder", async () => {
        const gateway = createFolderGateway({
            execute: jest.fn().mockImplementation(() => {
                return Promise.resolve(folder1);
            })
        });

        const createFolder = CreateFolder.instance(type, gateway);

        const createPromise = createFolder.execute(
            pick(folder1, ["title", "slug", "type", "parentId", "permissions"])
        );

        await createPromise;
        expect(gateway.execute).toHaveBeenCalledTimes(1);
    });
});
