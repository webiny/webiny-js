import { ContextPlugin } from "@webiny/handler";
import set from "lodash/set";
import { PbContext } from "~/graphql/types";
import { fetchEmbed, findProvider } from "~/graphql/graphql/pages/oEmbed";
import { useElementVariables } from "./useElementVariables";

const supportedTypes = ["soundcloud", "vimeo", "youtube", "pinterest", "twitter"];

export default new ContextPlugin<PbContext>(context => {
    context.pageBuilder.addPageElementProcessor(async ({ block, element }) => {
        if (!supportedTypes.includes(element.type)) {
            return;
        }

        const variables = useElementVariables(block, element);
        const value = variables?.length > 0 ? variables[0].value : null;

        if (value !== undefined && value !== null) {
            set(element, "data.source.url", value);

            const provider = findProvider(value);
            if (provider) {
                try {
                    const oembed = await fetchEmbed({ url: value }, provider);
                    set(element, "data.oembed", oembed);
                } catch {}
            }
        }
    });
});
