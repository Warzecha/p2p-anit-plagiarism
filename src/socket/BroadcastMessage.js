module.exports = class BroadcastMessage {
    constructor(peerId) {
        this.peerId = peerId;
        this.messageType = 'BROADCAST';
    }
};