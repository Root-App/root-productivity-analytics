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
  });
});
