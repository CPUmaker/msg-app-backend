import User from "../models/UserModel";

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
}

export default UserService;
