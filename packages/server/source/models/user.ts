import {
  createSchema,
  ExtractDoc,
  ExtractProps,
  Type,
  typedModel,
} from "ts-mongoose";

const UserRoles = ["editor", "admin"] as const;

export const UserSchema = createSchema(
  {
    _id: Type.string({ required: true }),
    username: Type.string({ unique: true }),
    avatar: Type.string({ unique: true }),
    email: Type.string({ unique: true }),
    role: Type.string({ required: true, enum: UserRoles }),
  },
  { timestamps: true }
);

export const User = typedModel("editors", UserSchema);
export default User;

export type UserType = ExtractDoc<typeof UserSchema>;
export type UserProps = ExtractProps<typeof UserSchema>;
