import { Page } from "~/types";

interface Handler {
    until: Function;
    listPages: Function;
}

export const waitPage = async (handler: Handler, page: Page) => {
    const pageIdentifier = page.title.match("Untitled") === null ? page.title : page.id;
    await handler.until(
        () =>
            handler.listPages({
                sort: ["createdOn_DESC"]
            }),
        ([response]) => {
            return response.data.pageBuilder.listPages.data.some(item => {
                return item.id === page.id && item.title === page.title;
            });
        },
        {
            name: `waiting for page ${pageIdentifier}`,
            wait: 500,
            tries: 30
        }
    );
};
