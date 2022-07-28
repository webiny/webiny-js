// @ts-ignore
import mdbid from "mdbid";
import { QueueJob, RenderJob } from "~/types";

interface Args {
    render?: RenderJob;
}

export default function (args: Args): QueueJob {
    return {
        id: mdbid(),
        args
    };
}
