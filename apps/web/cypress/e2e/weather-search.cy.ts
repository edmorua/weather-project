/// <reference types="cypress" />

describe('Weather search', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/weather*', {
      statusCode: 200,
      body: {
        location: {
          name: 'Charleston',
          country: 'US',
          state: 'SC',
          latitude: 32.7765,
          longitude: -79.9311,
        },
        units: 'imperial',
        current: {
          temperature: 72,
          feelsLike: 70,
          humidity: 50,
          pressure: 1013,
          windSpeed: 5,
          windDirectionDeg: 180,
          cloudsPercent: 10,
          visibilityMeters: 10000,
          description: 'clear sky',
          icon: '01d',
          sunriseIso: '2026-05-14T10:30:00.000Z',
          sunsetIso: '2026-05-14T23:55:00.000Z',
          observedAtIso: '2026-05-14T18:00:00.000Z',
        },
        hourly: [],
        daily: [],
        advisories: [],
        generatedAtIso: '2026-05-14T18:00:00.000Z',
        cached: false,
      },
    }).as('getWeather');
  });

  it('lets a visitor look up a city and see the current temperature', () => {
    cy.visit('/');
    cy.get('#locationQuery').type('Charleston');
    cy.contains('button', /^Search$/).click();
    cy.wait('@getWeather');
    cy.contains('h2', 'Charleston').should('exist');
    cy.contains('72°F').should('be.visible');
    cy.contains(/clear sky/i).should('be.visible');
  });
});
