const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.stack);

    // Database errors
    if (err.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Data sudah ada' });
    }

    // Default error
    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
};

module.exports = { errorHandler };
