import { createSchema, Type, typedModel } from "ts-mongoose";

export const EditorSchema = createSchema(
  {
    _id: Type.string({ required: true }),
    username: Type.string({ required: true, unique: true }),
    avatarUrl: Type.string({ required: true, unique: true }),
    email: Type.string({ required: true, unique: true }),
  },
  { timestamps: true }
);

export const EditorModel = typedModel("editors", EditorSchema);
export default EditorModel;
