import express from 'express';
import errorHandler from './middleware/errorHandler.mjs';
import cors from 'cors';
import ExpressWs from 'express-ws';
import routers, {mountRouter} from './middleware/router.mjs';

const app = ExpressWs(express()).app;
mountRouter();

app.use(cors());
app.use(express.json(), (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ status: false, msg: 'Invalid JSON body' });
    }
    next();
});
app.use(express.urlencoded({extended: true}));
app.use(errorHandler);
app.use('/api', routers);
app.use((req,res) => {
  res.status(404).json({'status':false, 'message': "This route does not exist."});
});

export default app;