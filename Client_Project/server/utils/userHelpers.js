const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/users.json');

// Helper: Read users from JSON file
function readUsersFromJson() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }

    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
}

// Helper: Write users to JSON file
function writeUsersToJson(users) {
    // Ensure parent directory exists (create recursively if needed)
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

module.exports = {
    readUsersFromJson,
    writeUsersToJson
};
