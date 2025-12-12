import { usePage as baseUsePage } from "@webiny/app-website-builder/modules/pages/PagesList/hooks/usePage.js";
import type { PageDto } from "@webiny/app-website-builder/domain/Page/index.js";
import type { WithWorkflows } from "~/types.js";

const decoratePage = (page: PageDto): WithWorkflows<PageDto> => {
    return {
        ...page,
        workflows: {
            // @ts-expect-error
            ...page.workflows
        },
        $selectable: false
    };
};

export const usePage = () => {
    const usage = baseUsePage();

    return {
        ...usage,
        page: decoratePage(usage.page)
    };
};
