import { user } from "./001.ddb";

export const createEsFormsData = () => {
    return [
        // Form with 1 revision published
        {
            formId: "65c0a07038a36e00082095ea",
            savedOn: "2024-02-05T08:47:01.134Z",
            publishedOn: "2024-02-05T08:47:01.134Z",
            published: true,
            locale: "en-US",
            createdOn: "2024-02-05T08:46:40.354Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 1",
            id: "65c0a07038a36e00082095ea#0001",
            locked: true,
            ownedBy: user,
            slug: "demo-form-1-65c0a07038a36e00082095ea",
            tenant: "root",
            status: "published"
        },

        // Form with 2 revisions: 1° published, 2° draft
        {
            formId: "65c479873ff56c0008735714",
            savedOn: "2024-02-08T06:50:17.141Z",
            publishedOn: null,
            published: false,
            locale: "en-US",
            createdOn: "2024-02-08T06:50:17.141Z",
            version: 2,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 2",
            id: "65c479873ff56c0008735714#0002",
            locked: false,
            ownedBy: user,
            slug: "demo-form-2-65c479873ff56c0008735714",
            tenant: "root",
            status: "draft"
        },

        // Form with 1 draft revision
        {
            formId: "65c492e1766cb000084357d1",
            savedOn: "2024-02-08T08:38:06.346Z",
            published: false,
            locale: "en-US",
            createdOn: "2024-02-08T08:37:53.951Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 3",
            id: "65c492e1766cb000084357d1#0001",
            locked: false,
            ownedBy: user,
            slug: "demo-form-3-65c492e1766cb000084357d1",
            tenant: "root",
            status: "draft"
        },

        // Form with 4 revisions: 1° published, 2° published, 3° unpublished, 4° draft
        {
            formId: "65c4994929b99b0008bd6167",
            savedOn: "2024-02-08T09:06:08.967Z",
            publishedOn: null,
            published: false,
            locale: "en-US",
            createdOn: "2024-02-08T09:06:08.967Z",
            version: 4,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 4",
            id: "65c4994929b99b0008bd6167#0004",
            locked: false,
            ownedBy: user,
            slug: "demo-form-4-65c4994929b99b0008bd6167",
            tenant: "root",
            status: "draft"
        },

        // Form with contact fields, required, organised in 2 steps
        {
            formId: "65c4a67e371e020008a5a8cb",
            savedOn: "2024-02-08T10:02:12.516Z",
            publishedOn: "2024-02-08T10:02:12.516Z",
            published: true,
            locale: "en-US",
            createdOn: "2024-02-08T10:01:34.873Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 5",
            id: "65c4a67e371e020008a5a8cb#0001",
            locked: true,
            ownedBy: user,
            slug: "demo-form-5-65c4a67e371e020008a5a8cb",
            tenant: "root",
            status: "published"
        },

        // Form with default fields
        {
            formId: "65c4c9d05e7aad0008b21715",
            savedOn: "2024-02-08T12:36:36.667Z",
            publishedOn: "2024-02-08T12:36:36.667Z",
            published: true,
            locale: "en-US",
            createdOn: "2024-02-08T12:32:16.133Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 6",
            id: "65c4c9d05e7aad0008b21715#0001",
            locked: true,
            ownedBy: user,
            slug: "demo-form-6-65c4c9d05e7aad0008b21715",
            tenant: "root",
            status: "published"
        },

        // Form with custom settings
        {
            formId: "65c4d1dfb0bf8a00087fbcd6",
            savedOn: "2024-02-08T13:07:56.618Z",
            published: false,
            locale: "en-US",
            createdOn: "2024-02-08T13:06:39.264Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 7",
            id: "65c4d1dfb0bf8a00087fbcd6#0001",
            locked: false,
            ownedBy: user,
            slug: "demo-form-7-65c4d1dfb0bf8a00087fbcd6",
            tenant: "root",
            status: "draft"
        },

        // Form 1 from root tenant, locale de-DE
        {
            formId: "65c4ea4ac04244000878b1e9",
            savedOn: "2024-02-08T14:51:05.869Z",
            publishedOn: "2024-02-08T14:51:05.869Z",
            published: true,
            locale: "de-DE",
            createdOn: "2024-02-08T14:50:50.570Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 8",
            id: "65c4ea4ac04244000878b1e9#0001",
            locked: true,
            ownedBy: user,
            slug: "demo-form-8-65c4ea4ac04244000878b1e9",
            tenant: "root",
            status: "published"
        },

        // Form 2 from root tenant, locale de-DE
        {
            formId: "65c4ea4ac04244000878b1f0",
            savedOn: "2024-02-08T14:51:05.869Z",
            publishedOn: "2024-02-08T14:51:05.869Z",
            published: true,
            locale: "de-DE",
            createdOn: "2024-02-08T14:50:50.570Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 9",
            id: "65c4ea4ac04244000878b1f0#0001",
            locked: true,
            ownedBy: user,
            slug: "demo-form-9-65c4ea4ac04244000878b1f0",
            tenant: "root",
            status: "published"
        },

        // Form 1 from root tenant, locale fr-FR
        {
            formId: "65c4ea4ac04244000878b1f1",
            savedOn: "2024-02-08T14:51:05.869Z",
            publishedOn: "2024-02-08T14:51:05.869Z",
            published: true,
            locale: "fr-FR",
            createdOn: "2024-02-08T14:50:50.570Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 10",
            id: "65c4ea4ac04244000878b1f1#0001",
            locked: true,
            ownedBy: user,
            slug: "demo-form-10-65c4ea4ac04244000878b1f1",
            tenant: "root",
            status: "published"
        },

        // Form 1 from otherTenant, locale fr-FR
        {
            formId: "65c4ea4ac04244000878b1f2",
            savedOn: "2024-02-08T14:51:05.869Z",
            publishedOn: "2024-02-08T14:51:05.869Z",
            published: true,
            locale: "fr-FR",
            createdOn: "2024-02-08T14:50:50.570Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 11",
            id: "65c4ea4ac04244000878b1f2#0001",
            locked: true,
            ownedBy: user,
            slug: "demo-form-11-65c4ea4ac04244000878b1f2",
            tenant: "otherTenant",
            status: "published"
        },

        // Form 2 from otherTenant, locale fr-FR
        {
            formId: "65c4ea4ac04244000878b1f3",
            savedOn: "2024-02-08T14:51:05.869Z",
            publishedOn: "2024-02-08T14:51:05.869Z",
            published: true,
            locale: "fr-FR",
            createdOn: "2024-02-08T14:50:50.570Z",
            version: 1,
            createdBy: user,
            webinyVersion: "0.0.0",
            __type: "fb.form",
            name: "Demo form 12",
            id: "65c4ea4ac04244000878b1f3#0001",
            locked: true,
            ownedBy: user,
            slug: "demo-form-12-65c4ea4ac04244000878b1f3",
            tenant: "otherTenant",
            status: "published"
        }
    ];
};
