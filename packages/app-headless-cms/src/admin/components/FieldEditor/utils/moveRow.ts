import { immutableSet } from "@webiny/utils/dotProp/index.js";
import type { CmsModel } from "~/types.js";

interface Params {
    source: number;
    destination: number;
    data: Pick<CmsModel, "layout">;
}
export default ({ data, source, destination }: Params) => {
    return immutableSet(data, "layout", (layout: string[][]) => {
        return source < destination
            ? [
                  ...layout.slice(0, source),
                  ...layout.slice(source + 1, destination),
                  layout[source],
                  ...layout.slice(destination)
              ]
            : [
                  ...layout.slice(0, destination),
                  layout[source],
                  ...layout.slice(destination, source),
                  ...layout.slice(source + 1)
              ];
    });
};
