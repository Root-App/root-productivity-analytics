class MixpanelMock {
    static init = jest.fn(() => new MixpanelMock());

    track = jest.fn();

    people = {
      set: jest.fn(
        (uuid, obj, cb) => {
          cb();
        },
      ),
    };
}

module.exports = MixpanelMock;
