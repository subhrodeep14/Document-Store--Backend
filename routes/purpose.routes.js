"use strict";

const express =
  require("express");

const router =
  express.Router();

const {
  getAllPurposes,
  getOrCreatePurpose,
} = require(
  "../controllers/purpose.controller"
);

const {
  authenticate,
} = require(
  "../middleware/auth.middleware"
);

const {
  PrismaClient,
} = require(
  "@prisma/client"
);

const prisma =
  new PrismaClient();

/*
──────────────────────────────────────
PROTECT
──────────────────────────────────────
*/

router.use(authenticate);

/*
──────────────────────────────────────
GET ALL
──────────────────────────────────────
*/

router.get(
  "/",
  getAllPurposes
);

/*
──────────────────────────────────────
CREATE
──────────────────────────────────────
*/

router.post(
  "/",
  getOrCreatePurpose
);

/*
──────────────────────────────────────
SEARCH
──────────────────────────────────────
*/

router.get(
  "/search",
  async (req, res) => {
    try {
      const q =
        req.query.q || "";

      const purposes =
        await prisma.purpose.findMany(
          {
            where: {
              OR: [
                {
                  name: {
                    contains:
                      q,
                    mode:
                      "insensitive",
                  },
                },

                {
                  code: {
                    contains:
                      q,
                    mode:
                      "insensitive",
                  },
                },
              ],
            },

            take: 10,

            orderBy: {
              createdAt:
                "desc",
            },
          }
        );

      res.json({
        purposes,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json(
        {
          error:
            "Failed to search purposes",
        }
      );
    }
  }
);

module.exports =
  router;