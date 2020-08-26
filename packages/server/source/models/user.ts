import { createSchema, ExtractDoc, Type, typedModel } from "ts-mongoose";

const UserRoles = ["editor", "admin"] as const;

export const UserSchema = createSchema(
  {
    _id: Type.string({ required: true }),
    username: Type.string({ required: true, unique: true }),
    avatarUrl: Type.string({ required: true, unique: true }),
    email: Type.string({ required: true, unique: true }),
    role: Type.string({ required: true, enum: UserRoles }),
  },
  { timestamps: true }
);

export const User = typedModel("editors", UserSchema);
export default User;

export type UserType = ExtractDoc<typeof UserSchema>;
