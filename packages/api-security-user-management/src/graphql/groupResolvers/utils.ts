import { Batch } from "@commodo/fields-storage";
import {
    GSI1_PK_GROUP,
    PK_GROUP,
    SK_GROUP
} from "@webiny/api-security-user-management/models/security.model";

export const createSecurityGroup = async ({ Model, group }) => {
    const PK = `${PK_GROUP}#${group.id}`;
    const GSI1_PK = GSI1_PK_GROUP;

    const securityRecordPrimary = new Model();
    securityRecordPrimary.PK = PK;
    securityRecordPrimary.SK = SK_GROUP;
    securityRecordPrimary.GSI1_PK = GSI1_PK;
    securityRecordPrimary.GSI1_SK = `name#${group.name.toLowerCase()}`;
    securityRecordPrimary.GSI_DATA = group;
    securityRecordPrimary.data = group;

    const securityRecordSecondary = new Model();
    securityRecordSecondary.PK = PK;
    securityRecordSecondary.SK = "slug";
    securityRecordSecondary.GSI1_PK = GSI1_PK;
    securityRecordSecondary.GSI1_SK = `slug#${group.slug}`;
    securityRecordSecondary.GSI_DATA = group;
    securityRecordSecondary.data = group;

    const batch = new Batch(
        // group item - A
        [securityRecordPrimary, "save"],
        // group item - slug
        [securityRecordSecondary, "save"]
    );

    await batch.execute();

    return securityRecordPrimary;
};
