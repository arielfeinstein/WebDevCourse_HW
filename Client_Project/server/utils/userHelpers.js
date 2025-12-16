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
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

module.exports = {
    readUsersFromJson,
    writeUsersToJson
};
