import { Batch } from "@commodo/fields-storage";
import {
    GSI1_PK_USER,
    PK_USER,
    SK_USER
} from "@webiny/api-security-user-management/models/securityUserData.model";

export const createSecurityUser = ({ Model, user }) => {
    const PK = `${PK_USER}#${user.id}`;

    const securityRecordPrimary = new Model();
    securityRecordPrimary.PK = PK;
    securityRecordPrimary.SK = SK_USER;
    securityRecordPrimary.GSI1_PK = GSI1_PK_USER;
    securityRecordPrimary.GSI1_SK = `login#${user.email}`;
    securityRecordPrimary.GSI_DATA = user;
    securityRecordPrimary.data = user;

    const securityRecordSecondary = new Model();
    securityRecordSecondary.PK = PK;
    securityRecordSecondary.SK = "createdOn";
    securityRecordSecondary.GSI1_PK = GSI1_PK_USER;
    securityRecordSecondary.GSI1_SK = `createdOn#${user.createdOn}`;
    securityRecordSecondary.GSI_DATA = user;
    securityRecordSecondary.data = user;

    // Here we can't use the "SecurityUser" because "Batch" operation works with "Model" and not "instance"
    const batch = new Batch(
        // User item - A
        [securityRecordPrimary, "save"],
        // User item - createdOn
        [securityRecordSecondary, "save"]
    );

    return batch.execute();
};

export const updateSecurityUser = async ({ Model, modelInstance, user }) => {
    const PK = `${PK_USER}#${user.id}`;

    // Instead of creating new instances of "Security Model" we are reusing
    const securityRecordPrimary = new Model();
    await securityRecordPrimary.populate(modelInstance);

    securityRecordPrimary.PK = PK;
    securityRecordPrimary.SK = SK_USER;
    securityRecordPrimary.GSI1_SK = `login#${user.email}`;

    const securityRecordSecondary = new Model();
    await securityRecordSecondary.populate(modelInstance);

    securityRecordSecondary.PK = PK;
    securityRecordSecondary.SK = "createdOn";
    securityRecordSecondary.GSI1_SK = `createdOn#${user.createdOn}`;

    const batch = new Batch(
        // User item - A
        [securityRecordPrimary, "save"],
        // User item - createdOn
        [securityRecordSecondary, "save"]
    );

    await batch.execute();
};
