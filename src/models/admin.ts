import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface IAdmin extends Document {
  username: string;
  password: string;
  role: "admin";
  validatePassword: (password: string) => Promise<boolean>;
  generateAuthToken: () => string;
}

const adminSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre<IAdmin>("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

adminSchema.methods.validatePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

adminSchema.methods.generateAuthToken = function (): string {
  return jwt.sign(
    { _id: this._id, username: this.username, type: "admin", role: this.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

export default mongoose.model<IAdmin>("Admin", adminSchema);
