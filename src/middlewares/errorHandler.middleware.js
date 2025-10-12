export function errorHandler(err, req, res, next) {
    console.error(err); // log error ke console/server log
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
}