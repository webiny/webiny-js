import { Tag } from "@webiny/api-prerendering-service/queue/add/types";

type Args = {
    tag: Tag;
    url?: string;
    dbNamespace?: string;
};

export default ({ tag, url, dbNamespace }: Args): [string, string] => {
    let PK, SK;
    if (tag && tag.key) {
        PK = [dbNamespace, "PS", "TAG", tag.key].filter(Boolean).join("#");
        SK = [tag.value, url].filter(Boolean).join("#");
    }

    return [PK, SK];
};
