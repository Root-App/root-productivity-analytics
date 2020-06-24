const waitForExpect = require('wait-for-expect');
const cli = require('../cli');
const MixpanelWrapper = require('../index');

jest.mock('../index');

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
});
