const {
  program,
} = require('commander');
const MixpanelWrapper = require('./index');

program
  .command('log')
  .option('-e, --event <event name>', 'Mixpanel event name')
  .option('-m, --metadata <metadata>', 'Mixpanel metadata object')
  .option('-sea, --stored-event-action <actionType>', 'Optional for stored events.  create or append')
  .action(async (cmdObj) => {
    const {
      event,
      metadata,
      storedEventAction,
    } = cmdObj;

    await MixpanelWrapper.upsertIdentity();

    const options = {};

    if (storedEventAction) {
      options.storedEvent = {
        action: storedEventAction,
      };
    }

    MixpanelWrapper.logEvent(event, JSON.parse(metadata), options);
  });

module.exports = program;
