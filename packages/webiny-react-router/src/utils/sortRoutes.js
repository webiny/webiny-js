import _ from "lodash";

const length = arr => arr.filter(v => !_.isEmpty(v)).length;

export default routes => {
    routes.sort((routeA, routeB) => {
        // 1 means 'a' goes after 'b'
        // -1 means 'a' goes before 'b'

        const a = routeA.path;
        const b = routeB.path;

        if (a === "*") {
            return 1;
        }

        if (b === "*") {
            return -1;
        }

        if (a.startsWith("/:") && !b.startsWith("/:")) {
            return 1;
        }

        const al = length(a.split("/"));
        const bl = length(b.split("/"));
        let position = al !== bl ? (al > bl ? -1 : 1) : 0;

        if (position !== 0) {
            return position;
        }

        // Compare number of variables
        const av = length(a.match(/:|\*/g) || []);
        const bv = length(b.match(/:|\*/g) || []);
        return av !== bv ? (av > bv ? 1 : -1) : 0;
    });
};
