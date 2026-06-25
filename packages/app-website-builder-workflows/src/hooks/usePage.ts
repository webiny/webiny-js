import { usePage as baseUsePage } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import type { PageDto } from "@webiny/app-website-builder/domain/Page/index.js";
import type { WithWorkflows } from "~/types.js";

const decoratePage = (page: PageDto): WithWorkflows<PageDto> => {
    return {
        ...page,
        workflow: page.system?.workflow ?? null
    };
};

export const usePage = () => {
    const usage = baseUsePage();

    return {
        ...usage,
        page: decoratePage(usage.page)
    };
};
