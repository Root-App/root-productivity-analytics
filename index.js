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
  })

  static logEvent = (event, metadata = {}) => {
    MixpanelWrapper._mixpanelInstance.track(event, {
      ...metadata,
      distinct_id: MixpanelWrapper.uuid,
    });
  }
}

module.exports = MixpanelWrapper;
