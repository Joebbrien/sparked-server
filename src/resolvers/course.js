import { AuthenticationError } from "apollo-server-express";
import { Course } from "../models/courses";
import { Unit } from "../models/unit";
import { Topic } from "../models/topic";
import * as yup from "yup";

const resolvers = {
  Query: {
    getCourses(root, args, { user }) {
      return Course.find({});
    }
  },
  Course: {
    // funny thing, you have access to the whole course
    units: course => {
      return Unit.find({ courseId: course._id });
    },
    topics: course => {
      return Topic.find({ courseId: course._id });
    }
  },
  Mutation: {
    async addCourse(root, args, { user }) {
      if (!user) {
        throw new AuthenticationError("you must be logged in to add a course");
      }
      let validate = yup.object().shape({
        name: yup.string().required()
      });
      await validate.validate(args).catch(function(err) {
        throw new Error(err);
      });

      let course = new Course();
      course.name = args.name;
      course.createdAt = new Date();
      course.createdBy = user._id;
      return course.save();
    },
    deleteCourse(root, args, { user }) {
      if (!user) {
        throw new AuthenticationError(
          "you must be logged in to delete a course"
        );
      }
      // Course.del
      console.log(args);

      return Course.deleteMany({ _id: { $in: args.ids } });

      // return Course.deleteOne({ _id: args.id })
    },
    updateCourse(root, args, { user }) {
      if (!user) {
        throw new AuthenticationError(
          "you must be logged in to update a course"
        );
      }
      let validate = yup.object().shape({
        name: yup.string().required(),
        id: yup.string().required(),

      });
      await validate.validate(args).catch(function(err) {
        throw new Error(err);
      });
      let _tempCource = Object.assign({}, args);

      delete _tempCource.id;
      return Course.updateOne({ _id: args.id }, { $set: _tempCource });
    }
  }
};

export default resolvers;
