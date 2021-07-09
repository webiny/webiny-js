import dot from "dot-prop-immutable";
import { CmsEditorFieldsLayout } from "~/types";

export default ({
    data,
    source,
    destination
}: {
    source: number;
    destination: number;
    data: { layout: CmsEditorFieldsLayout };
}) => {
    return dot.set(data, "layout", layout => {
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
