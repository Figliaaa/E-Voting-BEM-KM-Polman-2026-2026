const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => {
    return new Date().toISOString();
};

const logToFile = (level, message, data = {}) => {
    const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
    const logEntry = {
        timestamp: getTimestamp(),
        level,
        message,
        data
    };
    
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
};

const logger = {
    info: (message, data) => {
        console.log(`[${getTimestamp()}] ℹ️  ${message}`, data ? data : '');
        logToFile('INFO', message, data);
    },
    
    warn: (message, data) => {
        console.warn(`[${getTimestamp()}] ⚠️  ${message}`, data ? data : '');
        logToFile('WARN', message, data);
    },
    
    error: (message, data) => {
        console.error(`[${getTimestamp()}] ❌ ${message}`, data ? data : '');
        logToFile('ERROR', message, data);
    },
    
    debug: (message, data) => {
        if (process.env.DEBUG) {
            console.log(`[${getTimestamp()}] 🔧 ${message}`, data ? data : '');
            logToFile('DEBUG', message, data);
        }
    }
};

const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled Error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Terjadi kesalahan pada server'
        : err.message;

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { error: err.message })
    });
};

const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        logger[logLevel](
            `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
            {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration
            }
        );
    });
    
    next();
};

module.exports = {
    logger,
    errorHandler,
    requestLogger
};
