import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SearchEventDocument = HydratedDocument<SearchEvent>;

/**
 * Anonymous, append-only record of every weather lookup.
 * Used to power the popular-locations endpoint — no PII is captured.
 */
@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'search_events' })
export class SearchEvent {
  @Prop({ required: true, index: true })
  locationName!: string;

  @Prop({ default: '' })
  country!: string;

  @Prop({ required: true })
  latitude!: number;

  @Prop({ required: true })
  longitude!: number;

  @Prop({ required: true, enum: ['metric', 'imperial'] })
  units!: 'metric' | 'imperial';

  @Prop({ required: true, default: false })
  fromCache!: boolean;
}

export const SearchEventSchema = SchemaFactory.createForClass(SearchEvent);
SearchEventSchema.index({ createdAt: -1 });
