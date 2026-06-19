import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  name: string;

  /**
   * bcrypt hash — never returned to clients. Optional because GitHub OAuth
   * accounts have no local password.
   */
  @Prop({ default: '' })
  passwordHash: string;

  /** GitHub numeric id for OAuth accounts (sparse-unique). */
  @Prop({ index: true, sparse: true })
  githubId?: string;

  /** Avatar URL, populated for OAuth sign-ins. */
  @Prop({ default: '' })
  avatarUrl?: string;

  /**
   * The user's GitHub OAuth access token, encrypted at rest. Used to import
   * private repositories the account can access. Empty for non-GitHub users.
   */
  @Prop({ default: '' })
  githubAccessTokenEncrypted?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
