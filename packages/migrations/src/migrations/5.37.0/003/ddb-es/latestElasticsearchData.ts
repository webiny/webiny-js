import { CmsEntryAcoFolder } from "../types";
import { getCompressedData } from "../utils/getCompressedData";

const getEntryData = (input: CmsEntryAcoFolder): CmsEntryAcoFolder => {
    const output: any = {
        ...input
    };
    delete output["PK"];
    delete output["SK"];
    delete output["GSI1_PK"];
    delete output["GSI1_SK"];
    delete output["published"];
    delete output["latest"];

    return output;
};

export const getElasticsearchLatestEntryData = async (entry: any) => {
    return getCompressedData({
        ...getEntryData(entry),
        latest: true,
        TYPE: "L",
        __type: "cms.entry.l"
    });
};
