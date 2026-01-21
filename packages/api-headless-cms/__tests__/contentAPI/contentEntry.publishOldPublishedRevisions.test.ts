import { beforeEach, describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { identityA } from "./security/utils";

describe("Content entries - Entry Publishing", () => {
    const { manage, read } = useTestModelHandler({
        identity: identityA
    });

    beforeEach(async () => {
        await manage.setup();
    });

    it("should be able to publish a previously published revision (entry already has the latest revision published)", async () => {
        const { data: revision1 } = await manage.createTestEntry({
            variables: {
                data: {
                    values: {
                        title: "Revision 1"
                    }
                }
            }
        });

        await manage.publishTestEntry({
            variables: {
                revision: revision1.id
            }
        });

        const { data: revision2 } = await manage.createTestEntryFrom({
            variables: {
                revision: revision1.id,
                data: {
                    values: {
                        title: "Revision 2"
                    }
                }
            }
        });

        await manage.publishTestEntry({
            variables: {
                revision: revision2.id
            }
        });

        // Let's publish revision 1 again.
        await manage.publishTestEntry({
            variables: {
                revision: revision1.id
            }
        });

        const { data: manageEntriesList } = await manage.listTestEntries();
        const { data: readEntriesList } = await read.listTestEntries();

        expect(manageEntriesList).toHaveLength(1);
        expect(manageEntriesList).toMatchObject([
            {
                id: revision2.id,
                values: {
                    title: "Revision 2"
                },
                meta: {
                    status: "unpublished"
                }
            }
        ]);

        expect(readEntriesList).toHaveLength(1);
        expect(readEntriesList).toMatchObject([
            {
                id: revision1.id,
                values: {
                    title: "Revision 1"
                }
            }
        ]);
    });

    it("should be able to publish a previously published revision (entry already has a non-latest revision published)", async () => {
        const { data: revision1 } = await manage.createTestEntry({
            variables: {
                data: {
                    values: {
                        title: "Revision 1"
                    }
                }
            }
        });

        const { data: revision2 } = await manage.createTestEntryFrom({
            variables: {
                revision: revision1.id,
                data: {
                    values: {
                        title: "Revision 2"
                    }
                }
            }
        });

        // Let's publish revision 2.
        await manage.publishTestEntry({
            variables: {
                revision: revision2.id
            }
        });

        const { data: revision3 } = await manage.createTestEntryFrom({
            variables: {
                revision: revision2.id,
                data: {
                    values: {
                        title: "Revision 3"
                    }
                }
            }
        });

        // Let's publish revision 3.
        await manage.publishTestEntry({
            variables: {
                revision: revision3.id
            }
        });

        const { data: revision4 } = await manage.createTestEntryFrom({
            variables: {
                revision: revision3.id,
                data: {
                    values: {
                        title: "Revision 4"
                    }
                }
            }
        });

        {
            const { data: manageEntriesList } = await manage.listTestEntries();
            const { data: readEntriesList } = await read.listTestEntries();

            expect(manageEntriesList).toHaveLength(1);
            expect(manageEntriesList).toMatchObject([
                {
                    id: revision4.id,
                    values: {
                        title: "Revision 4"
                    },
                    meta: {
                        status: "draft",
                        revisions: [
                            {
                                values: {
                                    title: "Revision 4",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "draft",
                                    version: 4
                                }
                            },
                            {
                                values: {
                                    title: "Revision 3",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "published",
                                    version: 3
                                }
                            },
                            {
                                values: {
                                    title: "Revision 2",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "unpublished",
                                    version: 2
                                }
                            },
                            {
                                values: {
                                    title: "Revision 1",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "draft",
                                    version: 1
                                }
                            }
                        ]
                    }
                }
            ]);

            expect(readEntriesList).toHaveLength(1);
            expect(readEntriesList).toMatchObject([
                {
                    id: revision3.id,
                    values: {
                        title: "Revision 3"
                    }
                }
            ]);
        }

        // Let's publish older revision 2 .
        await manage.publishTestEntry({
            variables: {
                revision: revision2.id
            }
        });

        {
            const { data: manageEntriesList } = await manage.listTestEntries();
            const { data: readEntriesList } = await read.listTestEntries();

            expect(manageEntriesList).toHaveLength(1);
            expect(manageEntriesList).toMatchObject([
                {
                    id: revision4.id,
                    values: {
                        title: "Revision 4"
                    },
                    meta: {
                        status: "draft",
                        revisions: [
                            {
                                values: {
                                    title: "Revision 4",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "draft",
                                    version: 4
                                }
                            },
                            {
                                values: {
                                    title: "Revision 3",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "unpublished",
                                    version: 3
                                }
                            },
                            {
                                values: {
                                    title: "Revision 2",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "published",
                                    version: 2
                                }
                            },
                            {
                                values: {
                                    title: "Revision 1",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "draft",
                                    version: 1
                                }
                            }
                        ]
                    }
                }
            ]);

            expect(readEntriesList).toHaveLength(1);
            expect(readEntriesList).toMatchObject([
                {
                    id: revision2.id,
                    values: {
                        title: "Revision 2"
                    }
                }
            ]);
        }
    });

    it("should be able to publish a previously published revision (entry already has a non-latest revision published, using `createFrom` mutations to publish in this test)", async () => {
        const { data: revision1 } = await manage.createTestEntry({
            variables: {
                data: {
                    values: {
                        title: "Revision 1"
                    }
                }
            }
        });

        const { data: revision2 } = await manage.createTestEntryFrom({
            variables: {
                revision: revision1.id,
                data: {
                    status: "published",
                    values: {
                        title: "Revision 2"
                    }
                }
            }
        });

        const { data: revision3 } = await manage.createTestEntryFrom({
            variables: {
                revision: revision2.id,
                data: {
                    status: "published",
                    values: {
                        title: "Revision 3"
                    }
                }
            }
        });

        const { data: revision4 } = await manage.createTestEntryFrom({
            variables: {
                revision: revision3.id,
                data: {
                    values: {
                        title: "Revision 4"
                    }
                }
            }
        });

        {
            const { data: manageEntriesList } = await manage.listTestEntries();
            const { data: readEntriesList } = await read.listTestEntries();

            expect(manageEntriesList).toHaveLength(1);
            expect(manageEntriesList).toMatchObject([
                {
                    id: revision4.id,
                    values: {
                        title: "Revision 4"
                    },
                    meta: {
                        status: "draft",
                        revisions: [
                            {
                                values: {
                                    title: "Revision 4",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "draft",
                                    version: 4
                                }
                            },
                            {
                                values: {
                                    title: "Revision 3",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "published",
                                    version: 3
                                }
                            },
                            {
                                values: {
                                    title: "Revision 2",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "unpublished",
                                    version: 2
                                }
                            },
                            {
                                values: {
                                    title: "Revision 1",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "draft",
                                    version: 1
                                }
                            }
                        ]
                    }
                }
            ]);

            expect(readEntriesList).toHaveLength(1);
            expect(readEntriesList).toMatchObject([
                {
                    id: revision3.id,
                    values: {
                        title: "Revision 3"
                    }
                }
            ]);
        }

        // Let's publish older revision 2.
        await manage.publishTestEntry({
            variables: {
                revision: revision2.id
            }
        });

        {
            const { data: manageEntriesList } = await manage.listTestEntries();
            const { data: readEntriesList } = await read.listTestEntries();

            expect(manageEntriesList).toHaveLength(1);
            expect(manageEntriesList).toMatchObject([
                {
                    id: revision4.id,
                    values: {
                        title: "Revision 4"
                    },
                    meta: {
                        status: "draft",
                        revisions: [
                            {
                                values: {
                                    title: "Revision 4",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "draft",
                                    version: 4
                                }
                            },
                            {
                                values: {
                                    title: "Revision 3",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "unpublished",
                                    version: 3
                                }
                            },
                            {
                                values: {
                                    title: "Revision 2",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "published",
                                    version: 2
                                }
                            },
                            {
                                values: {
                                    title: "Revision 1",
                                    slug: revision1.values.slug
                                },
                                meta: {
                                    status: "draft",
                                    version: 1
                                }
                            }
                        ]
                    }
                }
            ]);

            expect(readEntriesList).toHaveLength(1);
            expect(readEntriesList).toMatchObject([
                {
                    id: revision2.id,
                    values: {
                        title: "Revision 2"
                    }
                }
            ]);
        }
    });
});
