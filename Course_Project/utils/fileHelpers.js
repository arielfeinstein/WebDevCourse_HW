const fs = require('fs');
const path = require('path');

/**
 * Ensures that the data directory exists.
 * @returns {string} The absolute path to the data directory.
 */
function ensureDataDirExists() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Created data directory:', dataDir);
    }
    return dataDir;
}

module.exports = { ensureDataDirExists };
