import pool from '../config/db.js';

export const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      name,
      first_name,
      last_name,
      phone,
      language
    } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET
          name = $1,
         first_name = $2,
         last_name = $3,
         phone = $4,
         language = $5,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *;
      `,
      [
        name,
        first_name,
        last_name,
        phone,
        language,
        userId,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
