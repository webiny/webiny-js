import { CmsEntryElasticsearchFieldPlugin } from "~/plugins/CmsEntryElasticsearchFieldPlugin";

export const elasticsearchFields = [
    new CmsEntryElasticsearchFieldPlugin({
        field: "createdOn",
        unmappedType: "date"
    }),
    new CmsEntryElasticsearchFieldPlugin({
        field: "savedOn",
        unmappedType: "date"
    }),
    new CmsEntryElasticsearchFieldPlugin({
        field: "publishedOn",
        unmappedType: "date"
    }),
    new CmsEntryElasticsearchFieldPlugin({
        field: "ownedBy",
        path: "ownedBy.id"
    }),
    new CmsEntryElasticsearchFieldPlugin({
        field: "createdBy",
        path: "createdBy.id"
    }),
    new CmsEntryElasticsearchFieldPlugin({
        field: "version",
        path: "version"
    }),
    new CmsEntryElasticsearchFieldPlugin({
        field: "status",
        path: "status"
    }),
    /**
     * Always add the ALL fields plugin because of the keyword/path build.
     */
    new CmsEntryElasticsearchFieldPlugin({
        field: CmsEntryElasticsearchFieldPlugin.ALL
    })
];
