import mongoose from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends mongoose.Document {
    username: string,
    email: string,
    password: string,
    comparePassword: (candidatePassword: string) => Promise<boolean>,
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      index: { unique: true },
      minlength: 6,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: { unique: true },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function preSave(next) {
  const user = this;
  if (user.isModified("password")) {
    return bcrypt
      .hash(user.password, 12)
      .then((hash) => {
        user.password = hash;
        return next();
      })
      .catch((error) => {
        return next(error);
      });
  }
  return next();
});

userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
