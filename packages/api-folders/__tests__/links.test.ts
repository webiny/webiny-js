import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/links";

describe("`links` CRUD", () => {
    const { links } = useGqlHandler();

    it("should be able to create, read, update and delete `links`", async () => {
        // Let's create some links.
        const [responseA] = await links.create({ data: mocks.linkA });
        const linkA = responseA.data.folders.createLink.data;
        expect(linkA).toEqual({ linkId: linkA.linkId, ...mocks.linkA });

        const [responseB] = await links.create({ data: mocks.linkB });
        const linkB = responseB.data.folders.createLink.data;
        expect(linkB).toEqual({ linkId: linkB.linkId, ...mocks.linkB });

        const [responseC] = await links.create({ data: mocks.linkC });
        const linkC = responseC.data.folders.createLink.data;
        expect(linkC).toEqual({ linkId: linkC.linkId, ...mocks.linkC });

        // Let's check whether both of the link exists, listing them by `folderId`.
        const [listResponse] = await links.list({ where: { folderId: "folder-1" } });
        expect(listResponse.data.folders.listLinks).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    {
                        id: expect.stringMatching(/link-a|link-b/),
                        linkId: expect.any(String),
                        folderId: expect.stringMatching("folder-1")
                    }
                ]),
                error: null
            })
        );

        const [listLinksResponse] = await links.list({ where: { folderId: "folder-2" } });
        expect(listLinksResponse.data.folders.listLinks).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    {
                        id: expect.stringMatching("link-c"),
                        linkId: expect.any(String),
                        folderId: expect.stringMatching("folder-2")
                    }
                ]),
                error: null
            })
        );

        // Let's update the "link-b" folderId.
        const updatedFolderId = "folder-2-updated";
        const [updateB] = await links.update({
            id: linkB.id,
            data: {
                folderId: updatedFolderId
            }
        });

        expect(updateB).toEqual({
            data: {
                folders: {
                    updateLink: {
                        data: {
                            ...mocks.linkB,
                            linkId: expect.any(String),
                            folderId: updatedFolderId
                        },
                        error: null
                    }
                }
            }
        });

        // Let's delete "link-b"
        const [deleteB] = await links.delete({
            id: linkB.id
        });

        expect(deleteB).toEqual({
            data: {
                folders: {
                    deleteLink: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not find "link-b"
        const [getB] = await links.get({ id: linkB.id });

        expect(getB).toMatchObject({
            data: {
                folders: {
                    getLink: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });

        // Should find "link-a" by id
        const [getA] = await links.get({ id: linkA.id });

        expect(getA).toEqual({
            data: {
                folders: {
                    getLink: {
                        data: {
                            ...mocks.linkA,
                            linkId: linkA.linkId
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should not allow creating an `link` with same `slug`", async () => {
        // Creating a folder
        await links.create({ data: mocks.linkA });

        // Creating a folder with same "slug" should not be allowed
        const [response] = await links.create({ data: mocks.linkA });

        expect(response).toEqual({
            data: {
                folders: {
                    createLink: {
                        data: null,
                        error: {
                            code: "LINK_EXISTS",
                            message: `Link with id "${mocks.linkA.id}" already exists.`,
                            data: null
                        }
                    }
                }
            }
        });
    });

    it("should not allow updating a non-existing `link`", async () => {
        const id = "any-id";
        const [result] = await links.update({
            id,
            data: {
                folderId: "any-folder-id"
            }
        });

        expect(result.data.folders.updateLink).toEqual({
            data: null,
            error: {
                code: "NOT_FOUND",
                message: `Link "${id}" was not found!`,
                data: null
            }
        });
    });
});
