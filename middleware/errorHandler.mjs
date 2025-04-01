import { Domain } from 'async-hook-domain';

const errorHandler = function (req, res, next) {
    new Domain(error => {
        if(!error.isOperational){
            console.error(error);
            process.exit(1);
        }
        if (!res.headersSent) {
            const response = {
                "status": false,
                "message": error.message
            };
            res.status(500).json(response);
        }
    });

    next();
}

export default errorHandler;