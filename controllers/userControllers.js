import generateToken from "../utils/generateToken.js";
import { getUserByUserId, pool } from "../database.js";

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  const [users] = await pool.query("SELECT * FROM users");
  for(const user of users) {
    delete user.password
  }
  res.json(users);
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  const id = req.params.id;
  const user = await getUserByUserId(id);
  if (user) {
    delete user.password
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
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
    res.status(400);
    throw new Error("User already exists");
  }

  if (password?.length < 6 || password?.length > 30) {
    res.status(404);
    throw new Error("validation failed");
  }

  if (username && (username.length < 4 || username.length > 20)) {
    res.status(404);
    throw new Error("validation failed");
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
    res.status(400);
    throw new Error("Invalid user data");
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  const user = await getUserByUserId(req.user.id);

  if (user) {
    const username = req.body.username;
    const password = req.body.password;
    if (username && (username.length < 4 || username.length > 20)) {
      res.status(404);
      throw new Error("validation failed");
    }
    user.name = req.body.name || user.name;
    user.image = req.body.image || user.image;
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    if (password) {
      if (password.length < 6 || password.length > 30) {
        res.status(404);
        throw new Error("validation failed");
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
    res.status(404);
    throw new Error("User not found");
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
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
    res.status(404);
    throw new Error("User not found");
  }
};

export { registerUser, updateUser, getUsers, deleteUser, getUserById };
