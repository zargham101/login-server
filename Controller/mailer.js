import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';

import ENV from '../config.js';

export const registerMail = async (req, res) => {
    const { username, userEmail, text, subject } = req.body;

    let config = {
        service: 'gmail',
        auth: {
            user: ENV.GMAIL,
            pass: ENV.GPASS
        }
    }

    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Zargham",
            link: 'https://mailgen.js/'
        }
    })

    var email = {
        body: {
            name: username,
            intro: text || 'Successful Sign Up',
            outro: 'This is way more important then anything you are trying to do right now...'
        }
    }

    let mail = MailGenerator.generate(email)

    let message = {
        from: ENV.GMAIL,
        to: userEmail,
        subject: subject || "Signup Successful",
        html: mail
    }

    transporter.sendMail(message).then(() => {
        return res.status(201).json({
            msg: "you should receive an email"
        })
    }).catch(error => {
        return res.status(500).json({ error })
    })
}









