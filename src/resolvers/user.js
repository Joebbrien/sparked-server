import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "apollo-server-express";
import pick from "lodash/pick";
import User from "../models/user";
import * as yup from "yup";

const userResolver = {
  Query: {
    allUsers(root, args, { user }) {
      // to see other users you should be logged in
      if (!user) {
        throw new AuthenticationError("you must be logged in");
      }
      return User.find({});
    },
    getUser(root, args, { user }) {
      return User.findOne({ email: user.email });
    },
    me(root, args, { user }) {
      return user;
    }
  },
  Mutation: {
    // Todo: Change this to createUser
    async register(root, { email, password, name, gender, role }) {
      let validate = yup.object().shape({
        email: yup
          .string()
          .required()
          .email(),
        password: yup
          .string()
          .required()
          .test(
            "len",
            "Password must be atleast eight (8) characters long",
            val => val.length >= 8
          ),
        name: yup.string().required(),
        gender: yup.string().required(),
        role: yup.string()
      });

      const checkEmpty = await validate
        .validate({ email, password, name, gender, role })
        .catch(function(err) {
          throw new Error(err);
        });
      if (checkEmpty) {
        let user = new User();
        user.email = email;
        user.name = name;
        user.gender = gender;
        user.role = role;
        user.password = await bcrypt.hash(password, 12);

        // check if the user already exist
        const _user = await User.findOne({ email });
        if (_user) {
          throw new Error(`${email} already exist`);
        }
        // check if the user is the first then grant them admin rights
        const users = await User.find({});
        user.role = !users.length ? "admin" : "student";
        return user.save();
      } else {
        throw new Error("Something wrong has accured, try again");
      }
    },
    async login(root, { email, password }, { SECRET }) {
      let validate = yup.object().shape({
        email: yup
          .string()
          .required()
          .email(),
        password: yup.string().required()
      });

      const isEmpty = await validate
        .validate({ email, password })
        .catch(function(err) {
          throw new Error(err);
        });
      if (!isEmpty) {
        //Some of the fields are empty
        throw new Error(`email or password cannot be empty`);
      } else {
        //fields not empty
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error("No user found ");
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new AuthenticationError("Incorrect password ");
        }
        //   sign in the user
        const token = await jwt.sign(
          {
            user: pick(user, ["_id", "email", "name", "role"])
          },
          SECRET,
          // this token will last for a year, this should be adjusted accordingly
          { expiresIn: "1y" }
        );
        return token;
      }
    },
    deleteUser(root, args, { user }) {
      // Todo: check if the user is admin and prevent deletion
      if (!user) {
        throw new AuthenticationError("you must be logged in to delete a user");
      }
      if (user.role != "admin") {
        throw new Error("you must be an admin to delete a user");
      }
      return User.deleteMany({ _id: { $in: args.ids } });
    }
  }
};

export default userResolver;
