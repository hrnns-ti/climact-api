import express from 'express';
import passport from './utils/passport.js';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

import authRoutes from './routes/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 5500;

app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: '250kb' }));
app.use(express.urlencoded({ limit: '250kb', extended: false }));
app.use(cors());
app.use(helmet());

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date(),
        message: 'ClimACT API is healthy'
    });
});

// ROUTES
app.use('/auth', authRoutes);

app.use(errorHandler);

app.listen(PORT, () => { console.log(`\nServer nyala di http://localhost:${PORT} cuy`); });