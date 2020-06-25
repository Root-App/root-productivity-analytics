const fs = require('fs');
const MixpanelWrapper = require('../index.js');

jest.mock('fs');
jest.mock('uuidv4', () => ({
  uuid: () => 1,
}));
// eslint-disable-next-line global-require
jest.mock('mixpanel', () => require('../mocks/mixpanel-mock'));

describe('MixpanelWrapper', () => {
  describe('getIdentifierCompletePath', () => {
    it('returns the expected result', () => {
      const identifierPath = MixpanelWrapper.getIdentifierCompletePath();
      expect(identifierPath).toEqual('/var/TMP/mixpanel-identifier.json');
    });
  });

  describe('upsertIdentity', () => {
    describe('when the identifier file does not exist', () => {
      beforeEach(() => {
        fs.existsSync.mockReturnValue(false);
      });

      it('creates a UUID and stores it in the identifier file', async () => {
        await MixpanelWrapper.upsertIdentity();
        expect(fs.writeFileSync).toHaveBeenCalledWith(
          MixpanelWrapper.getIdentifierCompletePath(),
          JSON.stringify({
            uuid: 1,
          }),
        );
      });

      it('calls mixpanel.people.set with the correct values', async () => {
        await MixpanelWrapper.upsertIdentity();
        expect(MixpanelWrapper._mixpanelInstance.people.set).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            $created: expect.any(String),
          }),
          expect.any(Function),
        );
      });
    });

    describe('when the identifier file does exist', () => {
      beforeEach(() => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(
          JSON.stringify({
            uuid: 1234,
          }),
        );
      });

      it('retrieves the UUID from the identifier file', async () => {
        await MixpanelWrapper.upsertIdentity();
        expect(MixpanelWrapper.uuid).toEqual(1234);
      });

      it('calls mixpanel.people.set with the correct values', async () => {
        await MixpanelWrapper.upsertIdentity();
        expect(MixpanelWrapper._mixpanelInstance.people.set).toHaveBeenCalledWith(
          1234,
          expect.objectContaining({
            $created: expect.any(String),
          }),
          expect.any(Function),
        );
      });
    });
  });

  describe('logEvent', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          uuid: 1234,
        }),
      );
    });

    it('calls mixpanel instance track function with expected values', async () => {
      await MixpanelWrapper.upsertIdentity();
      MixpanelWrapper.logEvent('testEvent', {
        metaData: 'test',
      });

      expect(MixpanelWrapper._mixpanelInstance.track).toHaveBeenCalledWith(
        'testEvent',
        expect.objectContaining({
          metaData: 'test',
          distinct_id: 1234,
        }),
      );
    });

    describe('stored events', () => {
      beforeEach(async () => {
        await MixpanelWrapper.upsertIdentity();
      });

      describe('when the stored events file exists', () => {
        beforeEach(() => {
          fs.existsSync.mockReturnValue(true);
        });

        it('does not create the file', () => {
          MixpanelWrapper.logEvent('test-event-name', {}, { storedEvent: { action: 'create' } });
          expect(fs.writeFileSync).not.toHaveBeenCalledWith(
            MixpanelWrapper.getStoredEventsPath(),
            JSON.stringify({}),
          );
        });
      });

      describe('when the stored events file does not exist', () => {
        beforeEach(() => {
          fs.existsSync.mockReturnValue(false);
        });

        it('creates the file', () => {
          MixpanelWrapper.logEvent('test-event-name', {}, { storedEvent: { action: 'create' } });
          expect(fs.writeFileSync).toHaveBeenCalledWith(
            MixpanelWrapper.getStoredEventsPath(),
            JSON.stringify({}),
          );
        });
      });

      describe('create action', () => {
        beforeEach(async () => {
          fs.existsSync.mockReturnValue(true);
          fs.readFileSync.mockImplementation((path) => {
            if (path === MixpanelWrapper.getIdentifierCompletePath()) {
              return JSON.stringify({
                uuid: 1234,
              });
            }

            return JSON.stringify({});
          });
          await MixpanelWrapper.upsertIdentity();
        });

        it('saves data to store events file as expected', () => {
          MixpanelWrapper.logEvent('test-event-name', {}, { storedEvent: { action: 'create' } });
          expect(fs.writeFileSync).toHaveBeenCalledWith(
            MixpanelWrapper.getStoredEventsPath(),
            expect.stringContaining('test-event-name'),
          );
        });

        it('calls track with stored_event_uuid', () => {
          MixpanelWrapper.logEvent('test-event-name', {}, { storedEvent: { action: 'create' } });
          expect(MixpanelWrapper._mixpanelInstance.track).toHaveBeenCalledWith(
            'test-event-name',
            expect.objectContaining({
              distinct_id: 1234,
              stored_event_uuid: 1,
            }),
          );
        });
      });

      describe('append action', () => {
        beforeEach(async () => {
          fs.existsSync.mockReturnValue(true);
          fs.readFileSync.mockImplementation((path) => {
            if (path === MixpanelWrapper.getIdentifierCompletePath()) {
              return JSON.stringify({
                uuid: 1234,
              });
            }

            return JSON.stringify({
              'test-event-name': '12345',
            });
          });
          await MixpanelWrapper.upsertIdentity();
        });

        it('calls track with expected data', () => {
          MixpanelWrapper.logEvent('test-event-name', {}, { storedEvent: { action: 'append' } });
          expect(MixpanelWrapper._mixpanelInstance.track).toHaveBeenCalledWith(
            'test-event-name',
            expect.objectContaining({
              distinct_id: 1234,
              stored_event_uuid: '12345',
            }),
          );
        });
      });
    });
  });
});
