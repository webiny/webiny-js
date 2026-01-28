import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types";
import type { Company as BaseCompany } from "@demo/tenant-management-shared";

export interface CompanyEntry extends CmsContentEntry, BaseCompany {}
