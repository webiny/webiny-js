import { UpdatePageBlockInput } from "~/admin/contexts/AdminPageBuilder/PageBlocks/BlockGatewayInterface";

export interface SaveBlockActionArgsType {
    execute(data: UpdatePageBlockInput): Promise<void>;
    debounce?: boolean;
    onFinish?: () => void;
}
