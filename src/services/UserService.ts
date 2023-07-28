import mongoose from "mongoose";

import User, { IUser } from "../models/UserModel";
import { IParticipant } from "../models/CoversationParticipantModel";

class UserService {
  static async findById(id: string) {
    return User.findById(id).exec();
  }

  static async findByEmail(email: string) {
    return User.findOne({ email }).exec();
  }

  static async findByUsername(username: string) {
    return User.findOne({ username }).exec();
  }

  static async createUser(username: string, email: string, password: string) {
    const user = new User();
    user.email = email;
    user.password = password;
    user.username = username;
    const savedUser = await user.save();
    return savedUser;
  }

  static userIsConversationParticipant(
    participants: Array<IParticipant>,
    userId: string
  ) {
    return !!participants.find(
      (p) => (p.user as IUser).id.toString() === userId
    );
  }
}

export default UserService;
