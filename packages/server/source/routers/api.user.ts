import Router from "@koa/router";
import Joi from "joi";

import { AppContext } from "../app";
import { User } from "../models/user";
import { AppError } from "../utils/error";

const router = new Router<{}, AppContext>({ prefix: "/api/user" });

const userProjection = (completeUser: boolean) =>
  completeUser ? undefined : "_id username avatar";

// Get all users
router.get("/", async ({ response, session }) => {
  let completeUser = false;
  // Show only full details if admin
  if (session?.user && session.user.isAdmin) completeUser = true;
  return (response.body = await User.find({}, userProjection(completeUser)));
});

// Get a specific user
router.get("/:id", async ({ query, session, response }) => {
  const id: string = query.id;

  let completeUser = false;
  if (session?.user) {
    // Show complete user only if admin or themself
    const user = session.user;
    if (user.id === id || user.isAdmin) completeUser = true;
  }

  response.body = await User.findById(id, userProjection(completeUser));
});

// Create user
router.post("/", async (ctx) => {
  const { session, body, response } = ctx;

  if (!session)
    throw new AppError("Session is undefined", { isOperational: false, ctx });

  // If not admin reject
  if (!session.user || !session.user.isAdmin) ctx.throw(401);

  // Validate body
  type Body = { id: string; role: "editor" | "admin" };
  const bodySchema = Joi.object<Body>({
    id: Joi.string(),
    role: Joi.string().pattern(/(role|editor)/),
  });

  const { error, value } = bodySchema.validate(body, { presence: "required" });
  if (error) ctx.throw(error, 400);

  await User.create(value);
  response.status = 201;
});
