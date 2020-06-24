const {
  program,
} = require('commander');
const MixpanelWrapper = require('./index');

program
  .command('log')
  .option('-e, --event <event name>', 'Mixpanel event name')
  .option('-m, --metadata <metadata>', 'Mixpanel metadata object')
  .action(async (cmdObj) => {
    const {
      event,
      metadata,
    } = cmdObj;

    await MixpanelWrapper.upsertIdentity();

    MixpanelWrapper.logEvent(event, JSON.parse(metadata));
  });

module.exports = program;
