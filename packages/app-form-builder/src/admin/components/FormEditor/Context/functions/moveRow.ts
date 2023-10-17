import { FbFormStep } from "~/types";

interface MoveRowParams {
    source: number;
    destination: number;
    data: FbFormStep;
}
export default ({ data, source, destination }: MoveRowParams): void => {
    data.layout =
        source < destination
            ? [
                  ...data.layout.slice(0, source),
                  ...data.layout.slice(source + 1, destination),
                  data.layout[source],
                  ...data.layout.slice(destination)
              ]
            : [
                  ...data.layout.slice(0, destination),
                  data.layout[source],
                  ...data.layout.slice(destination, source),
                  ...data.layout.slice(source + 1)
              ];
};
