import { createSchema, Type, typedModel } from "ts-mongoose";

import { EditorSchema } from "./editor";

export const PostSchema = createSchema(
  {
    title: Type.string({ required: true, unique: true }),
    content: Type.object({ required: true }).of({}),
    author: Type.ref({ schema: EditorSchema }),
  },
  { timestamps: true }
);

export const PostModel = typedModel("posts", PostSchema);
export default PostModel;
