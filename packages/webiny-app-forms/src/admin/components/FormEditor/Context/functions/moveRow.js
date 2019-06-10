// @flow

export default ({
    data,
    source,
    destination
}: {
    source: number,
    destination: number,
    data: Object
}) => {
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
