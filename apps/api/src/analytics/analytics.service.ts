import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { GeocodedLocation, TemperatureUnit } from '../weather/utils/weather.types';
import { SearchEvent, SearchEventDocument } from './schemas/search-event.schema';

export interface RecordSearchInput {
  location: GeocodedLocation;
  units: TemperatureUnit;
  fromCache: boolean;
}

export interface PopularLocation {
  locationName: string;
  country: string;
  latitude: number;
  longitude: number;
  count: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(SearchEvent.name) private readonly model: Model<SearchEventDocument>,
  ) {}

  async recordSearch(input: RecordSearchInput): Promise<void> {
    await this.model.create({
      locationName: input.location.name,
      country: input.location.country,
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      units: input.units,
      fromCache: input.fromCache,
    });
  }

  async popularLocations(windowHours = 24, limit = 10): Promise<PopularLocation[]> {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const cappedLimit = Math.min(Math.max(limit, 1), 50);

    const rows = await this.model
      .aggregate<{
        _id: { locationName: string; country: string; latitude: number; longitude: number };
        count: number;
      }>([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              locationName: '$locationName',
              country: '$country',
              latitude: { $round: ['$latitude', 2] },
              longitude: { $round: ['$longitude', 2] },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: cappedLimit },
      ])
      .exec();

    return rows.map((r) => ({
      locationName: r._id.locationName,
      country: r._id.country,
      latitude: r._id.latitude,
      longitude: r._id.longitude,
      count: r.count,
    }));
  }
}
