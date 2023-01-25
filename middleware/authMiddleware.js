import jwt from "jsonwebtoken";

import { CustomError } from '../utils/error.js'
import { getUserByUserId } from "../database.js";

const protect = async (req, res, next) => {
  let token;

  console.log('header ==>', req.headers)

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userInfo = await getUserByUserId(decoded.id);
      delete userInfo?.password;

      req.user = userInfo

      next();
    } catch (error) {
      console.error(error);
      throw new CustomError(400, 'Server error occured')
    }
  }

  if (!token) {
    throw new CustomError(400, 'Not authorized, no token')
  }
};

const admin = (req, res, next) => {
  try {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      throw new CustomError(400, 'Not authorized as an admin')
    }
  } catch (error) {
    console.log('error ===> ', error)
    throw new CustomError(500, 'server error occured')
  }
};

export { protect, admin };
