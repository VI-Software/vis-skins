const util = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');

const logDirectory = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const getMemoryUsage = () => {
    const used = process.memoryUsage();
    return {
        rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(used.external / 1024 / 1024)}MB`
    };
};

const getSystemInfo = () => {
    const cpus = os.cpus();
    const networkInterfaces = os.networkInterfaces();
    const loadAvg = os.loadavg();
    
    return {
        os: {
            platform: os.platform(),
            type: os.type(),
            release: os.release(),
            arch: os.arch(),
            uptime: `${Math.floor(os.uptime() / 3600)} hours`,
            totalMem: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
            freeMem: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
            cpus: {
                count: cpus.length,
                model: cpus[0].model,
                speed: `${cpus[0].speed}MHz`,
                loadAvg: {
                    '1m': loadAvg[0].toFixed(2),
                    '5m': loadAvg[1].toFixed(2),
                    '15m': loadAvg[2].toFixed(2)
                }
            }
        },
        process: {
            pid: process.pid,
            ppid: process.ppid,
            nodeVersion: process.version,
            versions: process.versions,
            platform: process.platform,
            arch: process.arch,
            title: process.title,
            uptime: `${Math.floor(process.uptime())}s`,
            memory: getMemoryUsage(),
            env: {
                nodeEnv: process.env.NODE_ENV,
                timezone: process.env.TZ,
            },
            resourceUsage: process.resourceUsage()
        },
        network: {
            hostname: os.hostname(),
            interfaces: networkInterfaces
        }
    };
};

const VI_SOFTWARE_ASCII = `
██╗   ██╗██╗    ███████╗ ██████╗ ███████╗████████╗██╗    ██╗ █████╗ ██████╗ ███████╗
██║   ██║██║    ██╔════╝██╔═══██╗██╔════╝╚══██╔══╝██║    ██║██╔══██╗██╔══██╗██╔════╝
██║   ██║██║    ███████╗██║   ██║█████╗     ██║   ██║ █╗ ██║███████║██████╔╝█████╗  
╚██╗ ██╔╝██║    ╚════██║██║   ██║██╔══╝     ██║   ██║███╗██║██╔══██║██╔══██╗██╔══╝  
 ╚████╔╝ ██║    ███████║╚██████╔╝██║        ██║   ╚███╔███╔╝██║  ██║██║  ██║███████╗
  ╚═══╝  ╚═╝    ╚══════╝ ╚═════╝ ╚═╝        ╚═╝    ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
`;

const LOG_FILE_HEADER = `${VI_SOFTWARE_ASCII}
=============================================================================
VI SOFTWARE SKIN SERVICE LOGS
=============================================================================

HOW TO READ THIS LOG FILE:
-------------------------
1. Each log entry is enclosed in borders with timestamps
2. Entries are separated by clear section breaks
3. All times are in ISO format (UTC)

Start of Today's Logs:
=============================================================================\n`;

const createLogBorder = (title = '') => {
    const borderLength = 80;
    const line = '='.repeat(borderLength);
    const timestamp = new Date().toISOString();
    return `\n${line}\n${' '.repeat((borderLength - title.length - timestamp.length - 4) / 2)}| ${title} - ${timestamp} |\n${line}`;
};

const createSectionBreak = (title = '') => {
    const line = '-'.repeat(40);
    return `\n${line} ${title} ${line}\n`;
};

const deleteOldLogs = () => {
    const files = fs.readdirSync(logDirectory);
    const now = new Date();
    const ninetyDaysInMillis = 90 * 24 * 60 * 60 * 1000;

    files.forEach(file => {
        const filePath = path.join(logDirectory, file);
        const fileDateStr = file.split('.')[0];
        const fileDate = new Date(fileDateStr);

        if (!isNaN(fileDate)) {
            const fileAge = now - fileDate;
            if (fileAge > ninetyDaysInMillis) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old log file: ${file}`);
            }
        }
    });
};

const ensureLogFileHeader = (filePath) => {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
        fs.writeFileSync(filePath, LOG_FILE_HEADER + createSystemInfoLog());
    }
};

const createSystemInfoLog = () => {
    const systemInfo = getSystemInfo();
    return `${createLogBorder('SYSTEM INITIALIZATION')}
${createSectionBreak('SERVER DETAILS')}
Start Time: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}
${createSectionBreak('SYSTEM INFO')}
${JSON.stringify(systemInfo, null, 2)}
${createLogBorder('END SYSTEM INFO')}\n`;
};

let logsEnabled = true;
let consoleLogsEnabled = true;

const logsMiddleware = (req, res, next) => {
    if (!logsEnabled) return next();
    
    const startTime = process.hrtime();
    const requestTimestamp = new Date();
    
    const logFileName = `${requestTimestamp.toISOString().split('T')[0]}.log`;
    const logFilePath = path.join(logDirectory, logFileName);
    
    ensureLogFileHeader(logFilePath);

    res.on('finish', () => {
        const diff = process.hrtime(startTime);
        const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        
        const logMessage = `${createLogBorder('SKIN REQUEST')}
${createSectionBreak('REQUEST DETAILS')}
Method: ${req.method}
URL: ${req.originalUrl}
IP: ${req.ip}
User Agent: ${req.headers['user-agent']}
Parameters: ${JSON.stringify(req.params)}
Query: ${JSON.stringify(req.query)}

${createSectionBreak('RESPONSE DETAILS')}
Status: ${res.statusCode}
Response Time: ${responseTime}ms
Memory Usage: ${JSON.stringify(getMemoryUsage(), null, 2)}

${createLogBorder('END REQUEST')}\n`;

        fs.appendFile(logFilePath, logMessage, (err) => {
            if (err) console.error('Failed to write log:', err);
        });

        if (consoleLogsEnabled) {
            console.log(`[${requestTimestamp.toISOString()}] ${req.method} ${req.originalUrl} - ${responseTime}ms`);
        }
    });

    next();
};

// Run cleanup every 24 hours
setInterval(deleteOldLogs, 24 * 60 * 60 * 1000);

module.exports = {
    logsMiddleware,
    setLogsEnabled: (enabled) => { logsEnabled = enabled; },
    setConsoleLogsEnabled: (enabled) => { consoleLogsEnabled = enabled; }
};
