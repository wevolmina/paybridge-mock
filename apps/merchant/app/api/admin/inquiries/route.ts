import {inquiryHandlers} from "../../../../lib/inquiries-http";
import {authorizedUser} from "../../../../lib/admin";
import {authorizedStaff} from "../../../../lib/staff";
import {getPool} from "../../../../lib/mysql";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const handlers=inquiryHandlers("admin",{identity:authorizedUser,staff:authorizedStaff,pool:getPool,adminOrigin:process.env.ADMIN_SITE_ORIGIN});
export const {GET,POST,OPTIONS}=handlers;
