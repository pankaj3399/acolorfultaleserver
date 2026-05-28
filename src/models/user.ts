import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  generateAuthToken: () => string;
  validatePassword: (password: string) => Promise<boolean>;
}

const userSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<IUser>("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.generateAuthToken = function (): string {
  return jwt.sign({ _id: this._id, type: "user" }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

userSchema.methods.validatePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
