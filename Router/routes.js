import { Router } from "express";
const router = Router();

import * as controller from '../Controller/controller.js';
import { registerMail } from '../Controller/mailer.js';
import auth, { localVariables } from '../middleware/auth.js';


/**POST methods */
router.route('/register').post(controller.register);
router.route('/registerMail').post(registerMail);
router.route('/auth').post(controller.verifyUser, (req, res) => res.end());
router.route('/login').post(controller.verifyUser, controller.login);

/**PUT methods */
router.route('/updateuser').put(auth, controller.updateUser);
router.route('/resetPassword').put(controller.verifyUser, controller.resetPassword);

/**GET methods */
router.route('/user/:username').get(controller.getUser);
router.route('/generateOTP').get(localVariables, controller.generateOTP);
router.route('/verifyOTP').get(controller.verifyUser, controller.verifyOTP);
router.route('/createResetSession').get(controller.createResetSession);

export default router;