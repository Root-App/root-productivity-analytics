const waitForExpect = require('wait-for-expect');
const cli = require('../cli');
const MixpanelWrapper = require('../index');

jest.mock('../index');
// eslint-disable-next-line global-require
jest.mock('mixpanel', () => require('../mocks/mixpanel-mock'));

describe('cli', () => {
  beforeEach(() => {
    cli.exitOverride(() => {}); // overriding the exit command for testing purposes.
  });

  describe('log', () => {
    it('calls MixpanelWrapper as expected', async () => {
      cli.parse(['log', '-e', 'testEvent', '-m', '{"test": "asdf"}'], {
        from: 'user',
      });

      expect(MixpanelWrapper.upsertIdentity).toHaveBeenCalled();

      await waitForExpect(() => {
        expect(MixpanelWrapper.logEvent).toHaveBeenCalled();
      });
    });
  });

  describe('log with stored action', () => {
    it('calls MixpanelWrapper with storedEvent option', async () => {
      cli.parse(['log', '-e', 'testEvent', '-m', '{"test": "asdf"}', '-sea', 'create'], {
        from: 'user',
      });

      expect(MixpanelWrapper.upsertIdentity).toHaveBeenCalled();

      await waitForExpect(() => {
        expect(MixpanelWrapper.logEvent).toHaveBeenCalledWith(
          'testEvent',
          {
            test: 'asdf',
          },
          {
            storedEvent: {
              action: 'create',
            },
          }
        );
      });
    });
  });
});
