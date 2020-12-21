import { pipe, withFields, string, boolean, withName } from "@webiny/commodo";
import { any } from "../../plugins/models/anyField";

export default ({ createBase }) => {
    return pipe(
        withName("CmsContentEntrySearch"),
        withFields({
            locale: string(),
            model: string(),
            revision: string(),
            published: boolean(),
            latestVersion: boolean(),
            fields: string(),
            v0: any(),
            v1: any(),
            v2: any(),
            v3: any(),
            v4: any(),
            v5: any(),
            v6: any(),
            v7: any(),
            v8: any(),
            v9: any()
        })
    )(createBase());
};
