import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/unlockingFields";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Unlocking Fields Test", () => {
    const { environment, database } = useContentHandler();

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it("should unlock all fields if when all content entries are deleted", async () => {
        const { content, createContentModel, updateContentModel, getContentModel } = environment(
            initial.environment.id
        );

        let contentModel = await createContentModel(
            mocks.book({ contentModelGroupId: initial.contentModelGroup.id })
        );
        const books = await content("book");

        const book1 = await books.create(mocks.book1);
        const book2 = await books.create(mocks.book2);

        // Should work.
        await updateContentModel({
            id: contentModel.id,
            data: {
                fields: mocks.fields
            }
        });

        // Removing a single field must not be allowed.
        let errors = [];
        for (let i = 0; i < mocks.fields.length; i++) {
            try {
                await updateContentModel({
                    id: contentModel.id,
                    data: {
                        fields: mocks.fields[i]
                    }
                });
            } catch (e) {
                errors.push(e.message);
            }
        }

        expect(errors).toEqual([
            `Cannot remove the field "age" because it's already in use in created content.`,
            `Cannot remove the field "title" because it's already in use in created content.`
        ]);

        // Deleting fields should still not be allowed. We still have book2 existing.
        await books.delete({ revision: book1.id });
        errors = [];
        for (let i = 0; i < mocks.fields.length; i++) {
            try {
                await updateContentModel({
                    id: contentModel.id,
                    data: {
                        fields: mocks.fields[i]
                    }
                });
            } catch (e) {
                errors.push(e.message);
            }
        }

        expect(errors).toEqual([
            `Cannot remove the field "age" because it's already in use in created content.`,
            `Cannot remove the field "title" because it's already in use in created content.`
        ]);

        // Removing fields should be now allowed, since both entries are deleted.
        await books.delete({ revision: book2.id });

        await updateContentModel({
            id: contentModel.id,
            data: {
                fields: mocks.fields[0]
            }
        });

        contentModel = await getContentModel({ id: contentModel.id });
        expect(contentModel).toEqual({
            fields: [
                {
                    _id: "vqk-UApa0-1",
                    fieldId: "title",
                    multipleValues: false
                }
            ],
            id: contentModel.id,
            indexes: [
                {
                    fields: ["id"]
                },
                {
                    fields: ["title"]
                }
            ],
            layout: [],
            lockedFields: [],
            name: "Book",
            titleFieldId: "title"
        });

        await updateContentModel({
            id: contentModel.id,
            data: {
                fields: []
            }
        });

        contentModel = await getContentModel({ id: contentModel.id });
        expect(contentModel).toEqual({
            id: contentModel.id,
            name: "Book",
            titleFieldId: null,
            indexes: [
                {
                    fields: ["id"]
                }
            ],
            lockedFields: [],
            fields: [],
            layout: []
        });
    });
});
