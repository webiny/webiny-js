import "cypress-wait-until";
import { addMatchImageSnapshotCommand } from "cypress-image-snapshot/command";
import "./login";
import "./dropFile";
import "./reloadUntil";
import "./pageBuilder/pbListPages";
import "./pageBuilder/pbCreatePage";
import "./pageBuilder/pbUpdatePage";
import "./pageBuilder/pbPublishPage";
import "./pageBuilder/pbDeletePage";
import "./pageBuilder/pbCreateMenu";
import "./pageBuilder/pbDeleteMenu";
import "./pageBuilder/pbCreateCategory";
import "./pageBuilder/pbDeleteCategory";
import "./headlessCms/cmsCreateContentModel";
import "./headlessCms/cmsUpdateContentModel";
import "./headlessCms/cmsDeleteContentModel";
import "./headlessCms/cmsListContentModelGroup";
import "./headlessCms/cmsCreateContentModelGroup";
import "./headlessCms/cmsDeleteContentModelGroup";
import "./security/securityCreateUser";
import "./security/securityDeleteUser";
import "./security/securityDeleteAllUsers";
import "./security/securityListUsers";
import "./security/securityReadRole";
import "./security/securityCreateRole";
import "./security/securityDeleteRole";
import "./security/securityReadApiKey";
import "./security/securityCreateApiKey";
import "./security/securityDeleteApiKey";
import "./fileManager/fmListFiles";
import "./fileManager/fmDeleteFile";
import "./fileManager/fmDeleteAllFiles";
import "./fileManager/fmListTags";
import "./formBuilder/fbDeleteForm";
import "cypress-mailosaur";

import "./aco/acoNavigateToFolder";

Cypress.Commands.overwrite("visit", (orig, url, options) => {
    return orig(url, { ...options, failOnStatusCode: false });
});

addMatchImageSnapshotCommand();
