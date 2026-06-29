// Single shared PrismaClient instance for the whole app.
// Importing this everywhere avoids opening multiple DB connection pools.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
