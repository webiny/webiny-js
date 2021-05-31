import "./login";
import "./dropFile";
import "./reloadUntil";
import "./pageBuilder/pbCreatePage";
import "./pageBuilder/pbUpdatePage";
import "./pageBuilder/pbPublishPage";
import "./pageBuilder/pbDeletePage";
import "./headlessCms/cmsCreateContentModel";
import "./headlessCms/cmsUpdateContentModel";
import "./headlessCms/cmsDeleteContentModel";
import "./headlessCms/cmsCreateContentModelGroup";
import "./headlessCms/cmsDeleteContentModelGroup";
import "./security/securityCreateUser";
import "./security/securityDeleteUser";
import "./security/securityReadGroup";
import "./security/securityCreateGroup";
import "./security/securityDeleteGroup";

Cypress.Commands.overwrite("visit", (orig, url, options) => {
    return orig(url, { ...options, failOnStatusCode: false });
});
