import { createSchema, ExtractDoc, Type, typedModel } from "ts-mongoose";

import { UserSchema } from "./user";

export const PostSchema = createSchema(
  {
    title: Type.string({ required: true, unique: true }),
    content: Type.object({ required: true }).of({}),
    author: Type.ref({ schema: UserSchema }),
  },
  { timestamps: true }
);

export const Post = typedModel("posts", PostSchema);
export default Post;

export type PostType = ExtractDoc<typeof PostSchema>;
