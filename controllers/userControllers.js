import generateToken from "../utils/generateToken.js";
import { getUserByUserId, pool } from "../database.js";
import { CustomError } from "../utils/error.js";

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT * FROM users");
    for (const user of users) {
      delete user.password;
    }
    res.json(users);
  } catch (error) {
    throw new CustomError(400, "users not found");
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await getUserByUserId(id);
    if (user) {
      delete user.password;
      res.json(user);
    } else {
      throw new CustomError(400, "User not found");
    }
  } catch (error) {
    throw new CustomError(500, 'Server error occured')
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const [userExists] = await pool.query(
      `
          SELECT *
          FROM users
          WHERE email = ?
      `,
      [email]
    );
  
    if (userExists?.length > 0) {
      throw new CustomError(400, 'User already exists')
    }
  
    if (password?.length < 6 || password?.length > 30) {
      throw new CustomError(400, 'validation failed')
    }
  
    if (username && (username.length < 4 || username.length > 20)) {
      throw new CustomError(400, 'validation failed')
    }
  
    const [result] = await pool.query(
      `
      INSERT INTO users (email, username, password)
      VALUES (?, ?, ?)
      `,
      [email, username, password]
    );
  
    const id = result.insertId;
    const user = await getUserByUserId(id);
  
    if (user) {
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(id),
      });
    } else {
      throw new CustomError(400, 'Invalid user data')
    }
  } catch (error) {
    console.log('error ===> ', error)
    throw new CustomError(500, 'Server error occured')
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const user = await getUserByUserId(req.user.id);

    if (user) {
      const username = req.body.username;
      const password = req.body.password;
      if (username && (username.length < 4 || username.length > 20)) {
        throw new CustomError(400, 'validation failed')
      }
      user.name = req.body.name || user.name;
      user.image = req.body.image || user.image;
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      if (password) {
        if (password.length < 6 || password.length > 30) {
          throw new CustomError(400, 'validation failed')
        }
        user.password = password;
      }
  
      const updatedUser = await pool.query(
        `
          UPDATE users
          SET username = ?, email = ?, password = ?, name = ?, image = ?
          WHERE id = ?;
          `,
        [user.username, user.email, user.password, user.name, user.image, user.id]
      );
  
      console.log("updated user : ", updatedUser);
  
      res.json({
        ...user,
        token: generateToken(updatedUser._id),
      });
    } else {
      throw new CustomError(400, 'User not found')
    }
  } catch (error) {
    console.log('error message ===> ', error)
    throw new CustomError(500, 'Server error occured')
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await getUserByUserId(req.params.id);

    if (user) {
      await pool.query(
        `
          DELETE FROM users
          WHERE id = ?;
          `,
        [user.id]
      );
      res.json({ message: "User removed" });
    } else {
      throw new CustomError(400, 'User not found')
    }
  } catch (error) {
    console.log('error message ===> ', error)
    throw new CustomError(500, 'Server error occured')
  }
};

export { registerUser, updateUser, getUsers, deleteUser, getUserById };
