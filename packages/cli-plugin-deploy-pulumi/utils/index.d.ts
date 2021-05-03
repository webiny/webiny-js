type StackOutput = Record<string, any>;

export function tagResources(tags: Record<string, string>): void;
export function getStackOutput(
    app: String,
    env: String,
    map?: Record<string, string>
): Promise<StackOutput>;
