import { PageElementId } from "~/graphql/crud/pages/PageElementId";

export class PageContent {
    private readonly content: any;

    private constructor(data: any) {
        this.content = data;
    }

    static createEmpty() {
        return new PageContent({
            id: PageElementId.create().getValue(),
            type: "document",
            elements: [],
            data: {}
        });
    }

    static createFrom(content: any) {
        return new PageContent(structuredClone(content));
    }

    getValue() {
        return this.content;
    }
}
