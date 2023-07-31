import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connect from './databse/connection.js';
import route from './Router/routes.js';

const app = express();

const port = 8080;

app.use(express());
app.use(cors());
app.use(morgan('tiny'));
app.disable('x-powered-by');
app.use(express.json());

app.get('/', (req, res) => {
    // res.status(200).json("Home get response");
    res.send(req.body);
})

/**api endpoints */

app.use('/api', route);

connect().then(() => {
    try {
        app.listen(port, () => {
            console.log(`Server connected to http://localhost:${port}`);
        })
    } catch (error) {
        console.log("Error connecting");
    }
}).catch(error => {
    console.log("invalid connection");
})

