const { dbAsync } = require('../config/database');

/**
 * User Repository - Handles all database operations for users
 */
class UserRepository {
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @param {string} userData.username
     * @param {string} userData.email
     * @param {string} userData.firstName
     * @param {string} userData.lastName
     * @param {string} userData.imgUrl
     * @param {string} userData.password - Already hashed password
     * @returns {Promise<Object>} Created user with id
     */
    async create(userData) {
        const { username, email, firstName, lastName, imgUrl, password } = userData;
        
        const result = await dbAsync.run(
            `INSERT INTO users (username, email, first_name, last_name, img_url, password) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [username, email, firstName, lastName || null, imgUrl || null, password]
        );

        return {
            id: result.lastID,
            username,
            email,
            firstName,
            lastName,
            imgUrl
        };
    }

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object|null>} User object or null
     */
    async findById(id) {
        const row = await dbAsync.get(
            'SELECT id, username, email, first_name, last_name, img_url, password FROM users WHERE id = ?',
            [id]
        );
        
        return row ? this._mapRowToUser(row) : null;
    }

    /**
     * Find user by username
     * @param {string} username
     * @returns {Promise<Object|null>} User object or null
     */
    async findByUsername(username) {
        const row = await dbAsync.get(
            'SELECT id, username, email, first_name, last_name, img_url, password FROM users WHERE username = ?',
            [username]
        );
        
        return row ? this._mapRowToUser(row) : null;
    }

    /**
     * Find user by email
     * @param {string} email
     * @returns {Promise<Object|null>} User object or null
     */
    async findByEmail(email) {
        const row = await dbAsync.get(
            'SELECT id, username, email, first_name, last_name, img_url, password FROM users WHERE email = ?',
            [email]
        );
        
        return row ? this._mapRowToUser(row) : null;
    }

    /**
     * Get all users
     * @returns {Promise<Array>} Array of user objects
     */
    async findAll() {
        const rows = await dbAsync.all(
            'SELECT id, username, email, first_name, last_name, img_url FROM users'
        );
        
        return rows.map(row => this._mapRowToUser(row, false));
    }

    /**
     * Update user
     * @param {number} id - User ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object|null>} Updated user or null if not found
     */
    async update(id, updates) {
        const allowedFields = ['username', 'email', 'first_name', 'last_name', 'img_url', 'password'];
        const fieldMapping = {
            firstName: 'first_name',
            lastName: 'last_name',
            imgUrl: 'img_url'
        };

        const setClause = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            const dbField = fieldMapping[key] || key;
            if (allowedFields.includes(dbField)) {
                setClause.push(`${dbField} = ?`);
                values.push(value);
            }
        }

        if (setClause.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        
        await dbAsync.run(
            `UPDATE users SET ${setClause.join(', ')} WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    /**
     * Delete user
     * @param {number} id - User ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
        const result = await dbAsync.run('DELETE FROM users WHERE id = ?', [id]);
        return result.changes > 0;
    }

    /**
     * Check if username exists
     * @param {string} username
     * @returns {Promise<boolean>}
     */
    async usernameExists(username) {
        const row = await dbAsync.get(
            'SELECT 1 FROM users WHERE username = ?',
            [username]
        );
        return !!row;
    }

    /**
     * Check if email exists
     * @param {string} email
     * @returns {Promise<boolean>}
     */
    async emailExists(email) {
        const row = await dbAsync.get(
            'SELECT 1 FROM users WHERE email = ?',
            [email]
        );
        return !!row;
    }

    /**
     * Map database row to user object
     * @private
     */
    _mapRowToUser(row, includePassword = true) {
        const user = {
            id: row.id,
            username: row.username,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            imgUrl: row.img_url
        };

        if (includePassword && row.password) {
            user.password = row.password;
        }

        return user;
    }
}

module.exports = new UserRepository();
