const { exampleMiddleware } = require("../middleware");
const exampleController = require("../controllers/exampleController");

module.exports = (app) => {
  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const router = require("express").Router();

  router.get(
    "/",
    exampleController.refactoreMe1
  );

  router.post(
    "/",
    exampleController.refactoreMe2
  );

  router.get(
    "/livethreatmap",
    exampleController.getData
  );

  router.get(
    "/manager",
  )

  app.use("/api/data", router);
};
