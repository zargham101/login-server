import UserModel from "../model/User.model.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ENV from '../config.js';
import otpGenerator from 'otp-generator';

export async function verifyUser(req, res, next) {
    try {
        const { username } = req.method === "GET" ? req.query : req.body;
        const exist = await UserModel.findOne({ username });
        if (!exist) {
            return res.status(404).send({
                error: "User not found"
            });
        }
        next();
    } catch (error) {
        return res.status(401).send({
            error: "Authentication error"
        });
    }
}


export async function register(req, res) {
    try {
        const { username, password, profile, email } = req.body;

        // Check the existing user
        const existUsername = UserModel.findOne({ username }).exec();
        const existEmail = UserModel.findOne({ email }).exec();

        // Wait for both queries to complete
        const [userByUsername, userByEmail] = await Promise.all([existUsername, existEmail]);

        if (userByUsername) {
            return res.status(409).json({ error: "Please use a unique username" });
        }

        if (userByEmail) {
            return res.status(409).json({ error: "Please use a unique email" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel({
            username,
            password: hashedPassword,
            profile: profile || '',
            email
        });

        // Save the user to the database
        const savedUser = await user.save();
        res.status(201).json({ msg: "User Register Successfully" });

    } catch (error) {
        res.status(500).json({ error: "An error occurred during registration" });
    }
}

export async function login(req, res) {

    const { username, password } = req.body;

    try {
        UserModel.findOne({ username })
            .then(user => {
                bcrypt.compare(password, user.password)
                    .then(checkPassword => {
                        if (!checkPassword) {
                            return res.status(404).send({
                                error: "Password is incorrect"
                            })
                        }
                        const token = jwt.sign({
                            userId: user._id,
                            username: user.username
                        }, ENV.JWT_SECRET, {
                            expiresIn: "24h"
                        });

                        return res.status(200).send({
                            msg: "Login successful",
                            username: user.username,
                            token
                        })
                    })
                    .catch(error => {
                        return res.status(404).send({
                            error: "Password does not exist"
                        })
                    })
                    .catch(error => {
                        return res.status(404).send({
                            error: "username not found"
                        })
                    })

            })

    } catch (error) {
        res.status(500).send({
            error
        })
    }
}


export async function getUser(req, res) {
    const { username } = req.params;
    try {
        if (!username) {
            return res.status(404).send({
                error: "No user available"
            });
        }

        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(404).send({
                error: "User not found"
            });
        }
        const { password, ...rest } = Object.assign({}, user.toJSON());

        return res.status(200).send(user);
    } catch (error) {
        return res.status(500).send({
            error: "Error occurred while fetching user"
        });
    }
}


export async function updateUser(req, res) {
    try {
        // const id = req.query.id;
        const { userId } = req.user;
        if (id) {
            const body = req.body;
            await UserModel.updateOne({ _id: userId }, body);
            return res.status(201).send({ msg: "Data updated successfully" });
        } else {
            return res.status(401).send({ error: "User not found" });
        }
    } catch (error) {
        return res.status(501).send({ error: "Invalid request" });
    }
}


export async function generateOTP(req, res) {
    req.app.locals.OTP = await otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
    res.status(201).send({ code: req.app.locals.OTP })

}


export async function verifyOTP(req, res) {
    const { code } = req.query;
    if (parseInt(req.app.locals.OTP) === parseInt(code)) {
        req.app.locals.OTP = null;
        req.app.locals.resetSession = true;
        return res.status(201).send({ msg: "Verified Successfully!" });
    }
    return res.status(401).send({ error: "Invalid OTP " })
}

export async function createResetSession(req, res) {
    if (req.app.locals.resetSession) {
        req.app.locals.resetSession = false;
        return res.status(201).send({ msg: "Access granted." });
    }
    return res.status(401).send({ error: "Session expired." });
}

export async function resetPassword(req, res) {
    try {
        if (!req.app.locals.resetSession) {
            return res.status(404).send({ error: "Session expired." });
        }
        const { username, password } = req.body;

        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(404).send({ error: "User not found" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await UserModel.updateOne(
            { username: user.username },
            { password: hashedPassword }
        );
        req.app.locals.resetSession = false;
        return res.status(200).send({ msg: "Password reset successful" });
    } catch (error) {
        return res.status(500).send({ error: "Internal server error" });
    }
}

