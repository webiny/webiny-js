import dot from "dot-prop-immutable";
import { CmsModel } from "~/types";

interface Params {
    source: number;
    destination: number;
    data: Pick<CmsModel, "layout">;
}
export default ({ data, source, destination }: Params) => {
    return dot.set(data, "layout", (layout: string[][]) => {
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
