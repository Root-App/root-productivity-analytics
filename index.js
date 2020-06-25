const Mixpanel = require('mixpanel');
const { uuid: uuidv4 } = require('uuidv4');
const fs = require('fs');

const TMP_DIR = '/var/TMP/';

class MixpanelWrapper {
  static uuid = '';

  static _mixpanelInstance = Mixpanel.init(process.env.MIXPANEL_TOKEN);

  static getIdentifierCompletePath() {
    return `${TMP_DIR}mixpanel-identifier.json`;
  }

  static getStoredEventsPath() {
    return `${TMP_DIR}stored-events.json`;
  }

  static getStoredEventsData() {
    if (!fs.existsSync(MixpanelWrapper.getStoredEventsPath())) {
      fs.writeFileSync(MixpanelWrapper.getStoredEventsPath(), JSON.stringify({}));
    }

    return JSON.parse(fs.readFileSync(MixpanelWrapper.getStoredEventsPath()));
  }

  static async upsertIdentity() {
    const identifierPath = MixpanelWrapper.getIdentifierCompletePath();

    if (fs.existsSync(identifierPath)) {
      const data = fs.readFileSync(identifierPath);
      MixpanelWrapper.uuid = JSON.parse(data).uuid;
    } else {
      MixpanelWrapper.uuid = uuidv4();
      fs.writeFileSync(identifierPath, JSON.stringify({ uuid: MixpanelWrapper.uuid }));
    }

    await MixpanelWrapper.setupMixpanelUser();
  }

  static setupMixpanelUser = () => new Promise((res, rej) => {
    MixpanelWrapper._mixpanelInstance.people.set(MixpanelWrapper.uuid, {
      $created: new Date().toISOString(),
    }, (error) => {
      if (error) {
        rej(error);
      } else {
        res();
      }
    });
  });

  static logEvent = (event, metadata = {}, options = {}) => {
    const eventProperties = {
      ...metadata,
      distinct_id: MixpanelWrapper.uuid,
    };

    /**
     * Stored events are used to identify a series of related events through a UUID.  Call with the
     * create action for the first event and then call with append action to relate following events
     * to the first action.
     */
    if (options.storedEvent && typeof options.storedEvent === 'object') {
      const storedData = MixpanelWrapper.getStoredEventsData();

      if (options.storedEvent.action === 'create') {
        const eventUuid = uuidv4();
        storedData[event] = eventUuid;
        fs.writeFileSync(MixpanelWrapper.getStoredEventsPath(), JSON.stringify(storedData));
        eventProperties.stored_event_uuid = eventUuid;
      } else if (options.storedEvent.action === 'append') {
        eventProperties.stored_event_uuid = storedData[event];
      } else {
        throw new Error('Invalid stored event option.');
      }
    }

    MixpanelWrapper._mixpanelInstance.track(event, eventProperties);
  };
}

module.exports = MixpanelWrapper;
