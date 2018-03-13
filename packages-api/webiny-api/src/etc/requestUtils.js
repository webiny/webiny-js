// @flow
import type { OrderTuple } from "webiny-entity/types";

/**
 * Create utility getters for the specified request object.
 * These helpers are mostly used in CRUD API methods when working with Entities.
 *
 * @param {express$Request} req Request object.
 * @returns {[string]: Function}
 */
export default (req: express$Request): { [string]: Function } => {
    const utils = {
        /**
         * Get query parameters.
         *
         * @param {string|null} name Parameter name to return.
         * @param {mixed} fallback Fallback value if parameter was not found by name.
         * @returns {mixed} Returns an object with all query parameters or a single value if name was specified.
         */
        getQuery(name: ?string, fallback: mixed = null): mixed {
            if (name) {
                return req.query[name] || fallback;
            }

            return req.query;
        },

        /**
         * Get filters.
         * Filters are all parameters that do not begin with "_" (an underscore is a prefix for platform specific parameters).
         * @returns {{}}
         */
        getFilters() {
            const queryFilters = {};
            const filters: Object = (utils.getQuery(): any);

            Object.keys(filters).map(key => {
                if (key.startsWith("_")) {
                    return;
                }

                queryFilters[key] = filters[key];
            });

            return queryFilters;
        },

        /**
         * Get fields.
         * Fields are fetched from "_fields" query parameter.
         * @param {string} fallback Fallback value if "_fields" parameter is not set.
         * @returns {string}
         */
        getFields(fallback: string = ""): string {
            let fields = utils.getQuery("_fields");

            return typeof fields !== "string" ? fallback : fields;
        },

        /**
         * Get sorters.
         * Sorters are fetched from "_sort" query parameter.
         * The parameter value is structured as a comma-separated string with +/- prefixes: "-email,+createdOn".
         * The string is parsed into an array of tuples: [["name", -1], ["createdOn", 1]]
         * "-" means DESCENDING.
         * "+" means ASCENDING.
         * @param fallback
         * @returns {Array<OrderTuple>} An array of tuples.
         */
        getSorters(fallback: Array<OrderTuple> = []): Array<OrderTuple> {
            const sort = utils.getQuery("_sort");
            if (typeof sort !== "string") {
                return fallback;
            }

            const dir = { "-": -1, "+": 1 };

            return sort.split(",").map(sorter => {
                if (sorter.startsWith("-") || sorter.startsWith("+")) {
                    return [sorter.slice(1), dir[sorter[0]]];
                }

                return [sorter, 1];
            });
        },

        /**
         * Get page.
         * Page is fetched from "_page" query parameter.
         * @param {number} fallback Page number to return if it is not found in query parameters.
         * @returns {number}
         */
        getPage(fallback: number = 1) {
            const page = parseInt(req.query._page);
            return !page || page < 1 ? fallback : page;
        },

        /**
         * Get perPage.
         * perPage is fetched from "_perPage" query parameter.
         * @param {number} fallback
         * @returns {number}
         */
        getPerPage(fallback: number = 10) {
            const perPage = parseInt(req.query._perPage);
            return isNaN(perPage) || perPage < 1 ? fallback : perPage;
        },

        /**
         * Get request body.
         * @returns {{}}
         */
        getBody() {
            return req.body || {};
        }
    };

    return utils;
};
