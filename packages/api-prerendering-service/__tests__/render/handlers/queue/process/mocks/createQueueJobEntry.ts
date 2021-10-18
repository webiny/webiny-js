import mdbid from "mdbid";
import { QueueJob } from "~/types";

interface Args {
    render?: {
        configuration?: {
            db?: {
                namespace?: string;
            };
        };
        tag?: {
            value: string;
            key: string;
        };
    };
}

export default function (args: Args): QueueJob {
    return {
        id: mdbid(),
        args
    };
}
