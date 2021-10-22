import mdbid from "mdbid";

type Args = {
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
};

export default function (args: Args) {
    return {
        SK: mdbid(),
        PK: "PS#Q#JOB",
        TYPE: "ps.queue.job",
        args
    };
}
