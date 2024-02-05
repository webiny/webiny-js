export default function (): {
    type: "cli-command";
    name: "cli-command-workspaces";
    // TODO write types at some point
    create: ({ yargs, context }: any) => void;
};
