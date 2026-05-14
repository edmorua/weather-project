import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Weather E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Stub global fetch so tests don't hit OpenWeather.
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes('/geo/1.0/direct')) {
        return new Response(
          JSON.stringify([
            { name: 'Testville', country: 'US', state: 'SC', lat: 32, lon: -80 },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('/data/2.5/weather')) {
        return new Response(
          JSON.stringify({
            coord: { lon: -80, lat: 32 },
            weather: [{ id: 800, main: 'Clear', description: 'clear', icon: '01d' }],
            main: { temp: 70, feels_like: 68, pressure: 1010, humidity: 40, temp_min: 65, temp_max: 75 },
            visibility: 10000,
            wind: { speed: 5, deg: 90 },
            clouds: { all: 0 },
            dt: 1700000000,
            sys: { country: 'US', sunrise: 1699970000, sunset: 1700013000 },
            timezone: 0,
            id: 1,
            name: 'Testville',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('/data/2.5/forecast')) {
        return new Response(
          JSON.stringify({
            city: { name: 'Testville', country: 'US', sunrise: 1699970000, sunset: 1700013000 },
            list: [
              {
                dt: 1700003600,
                main: { temp: 70, feels_like: 70, humidity: 50, temp_min: 65, temp_max: 75 },
                weather: [{ id: 800, main: 'Clear', description: 'clear', icon: '01d' }],
                wind: { speed: 4, deg: 100 },
                pop: 0.1,
                dt_txt: '2024-01-01 12:00:00',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response('not mocked', { status: 500 });
    }) as typeof fetch;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api', { exclude: ['health', 'health/(.*)'] });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/v1/weather?q=Testville returns a report', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/weather?q=Testville').expect(200);
    expect(res.body.location.name).toBe('Testville');
    expect(res.body.current.temperature).toBe(70);
    expect(res.body.cached).toBe(false);
  });

  it('second call hits the cache', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/weather?q=Testville').expect(200);
    expect(res.body.cached).toBe(true);
  });

  it('GET /health responds OK', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});
