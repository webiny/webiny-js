import { SearchConfiguration } from "~/components/AdvancedSearch/SearchConfiguration";

describe("SearchConfiguration", () => {
    it("should create a new SearchConfiguration with 1 group and 1 filter", () => {
        const searchConfiguration = new SearchConfiguration();

        const groups = searchConfiguration.groups;
        expect(groups.length).toEqual(1);

        const filters = groups[0].filters;
        expect(filters.length).toEqual(1);
    });
});
