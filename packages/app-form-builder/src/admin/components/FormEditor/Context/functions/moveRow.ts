import { FbFormModel } from "~/types";

interface MoveRowParams {
    source: number;
    destination: number;
    data: FbFormModel;
    anotherStep?: any;
    allSteps?: any;
}
export default ({ data, source, destination, anotherStep, allSteps }: MoveRowParams): void => {
    allSteps.steps.find((v: any) => v.id === data.id).layout =
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
