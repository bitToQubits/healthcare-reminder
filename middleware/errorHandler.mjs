import { Domain } from 'async-hook-domain';

const errorHandler = function (req, res, next) {
    const d = new Domain(error => {
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