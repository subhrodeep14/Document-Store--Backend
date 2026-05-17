
const bcrypt =
  require("bcryptjs");

const jwt =
  require("jsonwebtoken");

const {
  PrismaClient,
} = require(
  "@prisma/client"
);

const prisma =
  new PrismaClient();

/*
──────────────────────────────────────
TOKEN
──────────────────────────────────────
*/

const generateToken =
  (userId) => {
    return jwt.sign(
      {
        userId,
      },

      process.env
        .JWT_SECRET,

      {
        expiresIn: "7d",
      }
    );
  };

/*
──────────────────────────────────────
REGISTER
──────────────────────────────────────
*/

const register =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        email,
        password,
        name,
        accessCode,
      } = req.body;

      /*
      VALIDATION
      */

      if (
        !email ||
        !password ||
        !accessCode
      ) {
        return res
          .status(400)
          .json({
            error:
              "All fields required",
          });
      }

      /*
      EXISTING USER
      */

      const existingUser =
        await prisma.user.findUnique(
          {
            where: {
              email,
            },
          }
        );

      if (
        existingUser
      ) {
        return res
          .status(409)
          .json({
            error:
              "User already exists",
          });
      }

      /*
      COMPANY
      */

      let company =
        null;

      /*
      ROLE
      */

      let role =
        "EMPLOYEE";

      /*
      ADMIN CODE
      */

      company =
        await prisma.company.findFirst(
          {
            where: {
              adminCode:
                accessCode.toUpperCase(),
            },
          }
        );

      if (company) {
        role =
          "ADMIN";
      }

      /*
      EMPLOYEE CODE
      */

      if (!company) {
        company =
          await prisma.company.findFirst(
            {
              where: {
                employeeCode:
                  accessCode.toUpperCase(),
              },
            }
          );

        if (company) {
          role =
            "EMPLOYEE";
        }
      }

      /*
      INVALID CODE
      */

      if (!company) {
        return res
          .status(400)
          .json({
            error:
              "Invalid access code",
          });
      }

      /*
      PASSWORD
      */

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      /*
      CREATE USER
      */

      const user =
        await prisma.user.create(
          {
            data: {
              email,

              password:
                hashedPassword,

              role,

              companyId:
                company.id,

              name,
            },

            include: {
              company: true,
            },
          }
        );

      /*
      TOKEN
      */

      const token =
        generateToken(
          user.id
        );

      /*
      COOKIE
      */

      res.cookie(
        "authToken",
        token,
        {
          httpOnly: true,

          secure:
            process.env
              .NODE_ENV ===
            "production",

          sameSite:
            "lax",

          maxAge:
            7 *
            24 *
            60 *
            60 *
            1000,
        }
      );

      /*
      RESPONSE
      */

      return res.json({
        success: true,

        token,

        user: {
          id: user.id,

          email:
            user.email,

          role:
            user.role,

          companyId:
            user.companyId,

          company:
            user.company,

          name:
            user.name,
        },
      });
    } catch (err) {
      console.error(
        err
      );

      next(err);
    }
  };

/*
──────────────────────────────────────
LOGIN
──────────────────────────────────────
*/

const login =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        email,
        password,
      } = req.body;

      /*
      SUPER ADMIN
      ENV LOGIN
      */

      if (
        email ===
          process.env
            .SUPER_ADMIN_EMAIL &&
        password ===
          process.env
            .SUPER_ADMIN_PASSWORD
      ) {
        const superAdmin =
          {
            id:
              "SUPER_ADMIN",

            email,

            role:
              "SUPER_ADMIN",

            companyId:
              null,

            company:
              null,

            name:
              "Super Admin",
          };

        const token =
          generateToken(
            superAdmin.id
          );

        res.cookie(
          "authToken",
          token,
          {
            httpOnly: true,

            secure:
              process.env
                .NODE_ENV ===
              "production",

            sameSite:
              "lax",

            maxAge:
              7 *
              24 *
              60 *
              60 *
              1000,
          }
        );

        return res.json({
          success: true,

          token,

          user:
            superAdmin,
        });
      }

      /*
      NORMAL USER
      */

      const user =
        await prisma.user.findUnique(
          {
            where: {
              email,
            },

            include: {
              company: true,
            },
          }
        );

      /*
      INVALID
      */

      if (
        !user
      ) {
        return res
          .status(401)
          .json({
            error:
              "Invalid credentials",
          });
      }

      /*
      PASSWORD
      */

      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (
        !isMatch
      ) {
        return res
          .status(401)
          .json({
            error:
              "Invalid credentials",
          });
      }

      /*
      TOKEN
      */

      const token =
        generateToken(
          user.id
        );

      /*
      COOKIE
      */

      res.cookie(
        "authToken",
        token,
        {
          httpOnly: true,

          secure:
            process.env
              .NODE_ENV ===
            "production",

          sameSite:
            "lax",

          maxAge:
            7 *
            24 *
            60 *
            60 *
            1000,
        }
      );

      /*
      RESPONSE
      */

      return res.json({
        success: true,

        token,

        user: {
          id: user.id,

          email:
            user.email,

          role:
            user.role,

          companyId:
            user.companyId,

          company:
            user.company,

          name:
            user.name,
        },
      });
    } catch (err) {
      console.error(
        err
      );

      next(err);
    }
  };

/*
──────────────────────────────────────
LOGOUT
──────────────────────────────────────
*/

const logout =
  async (
    req,
    res
  ) => {
    res.clearCookie(
      "authToken"
    );

    return res.json({
      success: true,

      message:
        "Logged out successfully",
    });
  };

/*
──────────────────────────────────────
ME
──────────────────────────────────────
*/

const me =
  async (
    req,
    res,
    next
  ) => {
    try {
      /*
      SUPER ADMIN
      */

      if (
        req.user.id ===
        "SUPER_ADMIN"
      ) {
        return res.json({
          user:
            req.user,
        });
      }

      /*
      NORMAL USER
      */

      const user =
        await prisma.user.findUnique(
          {
            where: {
              id:
                req.user.id,
            },

            include: {
              company: true,
            },
          }
        );

      return res.json({
        user,
      });
    } catch (err) {
      next(err);
    }
  };

module.exports = {
  register,

  login,

  logout,

  me,
};

