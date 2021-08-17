type StackOutput = Record<string, any>;

export function tagResources(tags: Record<string, string>): void;
export function getStackOutput(
    folder: string,
    env: string,
    map?: Record<string, string>
): StackOutput;

export function getStackOutput(options: {
    folder: string;
    env: string;
    map?: Record<string, string>;
    cwd?: string;
}): StackOutput;
