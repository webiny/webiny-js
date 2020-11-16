import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { HandlerI18NContentContext } from "@webiny/api-i18n-content/types";
import mdbid from "mdbid";
import { withFields, string } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import defaults from "./defaults";

export type PageElement = {
    name: string;
    type: "element" | "block";
    category: string;
    content: Record<string, any>; // // TODO: define types
    preview: Record<string, any>; // TODO: define types
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
};

const CreateDataModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    type: string({ validation: validation.create("required,in:element:block") }),
    category: string({ validation: validation.create("required,maxLength:100") }),
    content: object({ validation: validation.create("required") }),
    preview: object({ validation: validation.create("required") })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    type: string({ validation: validation.create("in:element:block") }),
    category: string({ validation: validation.create("maxLength:100") }),
    content: object(),
    preview: object()
})();

const TYPE = "pb#page-element";

export default {
    type: "context",
    apply(context) {
        const { db, i18nContent } = context;
        const PK_PAGE_ELEMENT = `P#${i18nContent?.locale?.code}`;

        context.pageElements = {
            async get(id: string) {
                const [[menu]] = await db.read<PageElement>({
                    ...defaults.db,
                    query: { PK: PK_PAGE_ELEMENT, SK: id },
                    limit: 1
                });

                return menu;
            },

            async list() {
                const [pageElements] = await db.read<PageElement>({
                    ...defaults.db,
                    query: { PK: PK_PAGE_ELEMENT, SK: { $gt: " " } }
                });

                return pageElements;
            },

            async create(data) {
                const identity = context.security.getIdentity();
                const createData = new CreateDataModel().populate(data);
                await createData.validate();

                const id = mdbid();

                data = Object.assign(await createData.toJSON(), {
                    PK: PK_PAGE_ELEMENT,
                    SK: id,
                    TYPE,
                    id,
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        type: identity.type,
                        displayName: identity.displayName
                    }
                });

                await db.create({ ...defaults.db, data });

                return data;
            },

            async update(id, data) {
                const updateData = new UpdateDataModel().populate(data);
                await updateData.validate();

                data = await updateData.toJSON({ onlyDirty: true });

                await db.update({
                    ...defaults.es,
                    query: { PK: PK_PAGE_ELEMENT, SK: id },
                    data
                });

                return data;
            },

            async delete(id) {
                await db.delete({
                    ...defaults.db,
                    query: { PK: PK_PAGE_ELEMENT, SK: id }
                });
            }
        };
    }
} as ContextPlugin<DbContext, HandlerI18NContentContext>;
