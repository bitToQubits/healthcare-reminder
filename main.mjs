import express from 'express';
import router from './middleware/router.mjs';
import errorHandler from './middleware/errorHandler.mjs';
import cors from 'cors';
import { WebSocketExpress } from 'websocket-express';

const app = new WebSocketExpress();

app.use(cors());

app.use(express.json(), (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ status: false, msg: 'Invalid JSON body' });
    }
    next();
});

app.use(errorHandler);
app.use('/api', router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {

})