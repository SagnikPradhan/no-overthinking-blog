import { prop, getModelForClass } from '@typegoose/typegoose'

export class User {
  @prop({ required: true })
  public _id!: string

  @prop({ required: true, trim: true })
  public username!: string

  @prop({ required: true, trim: true, unique: true })
  public email!: string

  @prop({ required: true })
  public avatar!: string

  @prop({ default: false })
  public isEditor!: boolean
}

export const UserModel = getModelForClass(User)
