const Router = require('express');
const router = new Router();
const controller = require('../controllers/storageController');
const checkAdminMiddleware = require('../middlewares/checkAdminMiddleware');
const checkStaffMiddleware = require("../middlewares/checkStaffMiddleware");

router.post("/volume/", checkAdminMiddleware, controller.addVolume);
router.patch("/volume/", checkAdminMiddleware, controller.editVolume);
router.get('/', checkStaffMiddleware,controller.getStorages);
router.post("/", checkAdminMiddleware, controller.addStorage);
router.patch("/:id/", checkAdminMiddleware, controller.editStorage);
router.delete("/:id/", checkAdminMiddleware, controller.deleteStorage);

module.exports = router;
