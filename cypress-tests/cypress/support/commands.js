import "cypress-wait-until";
import { addMatchImageSnapshotCommand } from "cypress-image-snapshot/command";
import "./login";
import "./dropFile";
import "./reloadUntil";
import "./pageBuilder/pbListPages";
import "./pageBuilder/pbCreatePage";
import "./pageBuilder/pbCreatePageTemplate";
import "./pageBuilder/pbCreateBlock";
import "./pageBuilder/pbCreateCategory";
import "./pageBuilder/pbCreateCategoryAndBlocks";
import "./pageBuilder/pbUpdatePage";
import "./pageBuilder/pbCreateCategory";
import "./pageBuilder/pbDeleteAllCategories";
import "./pageBuilder/pbPublishPage";
import "./pageBuilder/pbDeletePage";
import "./pageBuilder/pbCreateMenu";
import "./pageBuilder/pbDeleteMenu";
import "./pageBuilder/pbUpdatePageTemplate";
import "./pageBuilder/pbListPageTemplates";
import "./pageBuilder/pbListPageBlocks";
import "./pageBuilder/pbDeleteAllBlocks";
import "./pageBuilder/pbDeleteAllTemplates";
import "./pageBuilder/pbDeleteAllBlockCategories";
import "./pageBuilder/pbListBlockCategories";
import "./pageBuilder/pbCreateCategory";
import "./pageBuilder/pbDeleteCategory";
import "./pageBuilder/pbListPageTemplates";
import "./headlessCms/cmsCreateContentModel";
import "./headlessCms/cmsUpdateContentModel";
import "./headlessCms/cmsDeleteContentModel";
import "./headlessCms/cmsListContentModelGroup";
import "./headlessCms/cmsCreateContentModelGroup";
import "./headlessCms/cmsDeleteContentModelGroup";
import "./headlessCms/cmsDeleteAllContentModelGroups";
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
import "./formBuilder/fbDeleteAllForms";
import "./formBuilder/fbDeleteForm";
import "cypress-mailosaur";
import "./aco/acoNavigateToFolder";

Cypress.Commands.overwrite("visit", (orig, url, options) => {
    return orig(url, { ...options, failOnStatusCode: false });
});

addMatchImageSnapshotCommand();
