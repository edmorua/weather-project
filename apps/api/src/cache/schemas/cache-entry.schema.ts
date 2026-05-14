import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CacheEntryDocument = HydratedDocument<CacheEntry>;

@Schema({ timestamps: true, collection: 'cache_entries' })
export class CacheEntry {
  @Prop({ required: true, unique: true, index: true })
  key!: string;

  @Prop({ type: Object, required: true })
  value!: unknown;

  /**
   * Mongo TTL monitor deletes documents whose `expiresAt` is in the past.
   * The index below makes that automatic — no cron required.
   */
  @Prop({ required: true, index: { expireAfterSeconds: 0 } })
  expiresAt!: Date;
}

export const CacheEntrySchema = SchemaFactory.createForClass(CacheEntry);
