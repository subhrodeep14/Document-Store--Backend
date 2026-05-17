
const express =
  require("express");

const router =
  express.Router();

const {
  createCompany,

  getAllCompanies,

  searchCompanies,

  regenerateAdminCode,

  regenerateEmployeeCode,
} = require(
  "../controllers/company.controller"
);

const {
  authenticate,

  allowRoles,
} = require(
  "../middleware/auth.middleware"
);

/*
──────────────────────────────────────
PROTECTED
──────────────────────────────────────
*/

router.use(
  authenticate
);

/*
──────────────────────────────────────
CREATE COMPANY
SUPER ADMIN ONLY
──────────────────────────────────────
*/

router.post(
  "/create",

  allowRoles(
    "SUPER_ADMIN"
  ),

  createCompany
);

/*
──────────────────────────────────────
GET ALL
ADMIN + SUPER ADMIN
──────────────────────────────────────
*/

router.get(
  "/",

  allowRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),

  getAllCompanies
);

/*
──────────────────────────────────────
SEARCH
ALL LOGGED USERS
──────────────────────────────────────
*/

router.get(
  "/search",

  searchCompanies
);

/*
──────────────────────────────────────
REGENERATE ADMIN CODE
SUPER ADMIN ONLY
──────────────────────────────────────
*/

router.patch(
  "/:companyId/regenerate-admin-code",

  allowRoles(
    "SUPER_ADMIN"
  ),

  regenerateAdminCode
);

/*
──────────────────────────────────────
REGENERATE EMPLOYEE CODE
ADMIN + SUPER ADMIN
──────────────────────────────────────
*/

router.patch(
  "/:companyId/regenerate-employee-code",

  allowRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),

  regenerateEmployeeCode
);

module.exports =
  router;
