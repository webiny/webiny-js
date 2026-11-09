import { z } from "zod";

/*
 * Specs of the `Core/Pulumi`, `Api/Pulumi` and `Admin/Pulumi` extensions, used by the shared
 * `Infra` namespace. They render the same config entry as the full definitions in
 * `@webiny/project-aws`, which register with the project and validate that `src` implements the
 * matching Pulumi abstraction.
 */
export const pulumiSrcParamsSchema = z.object({
    src: z.string().describe("Path to a file that implements the app's Pulumi abstraction.")
});
