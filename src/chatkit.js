import { ChatManager, TokenProvider } from '@pusher/chatkit-client'

const INSTANCE_LOCATOR = process.env.VUE_APP_INSTANCE_LOCATOR;
const TOKEN_URL = process.env.VUE_APP_TOKEN_URL;
const MESSAGE_LIMIT = Number( process.env.VUE_APP_MESSAGE_LIMIT ) || 10;

import moment from 'moment'
import store from './store/index'

let currentUser = null;
let activeRoom = null;

function setMembers() {
    const members = activeRoom.users.map( user => ({
        username: user.id,
        name: user.name,
        presence: user.presence.state
    }) );

    store.commit( 'setUsers', members );
}

async function subscribeToRoom( roomId ) {
    store.commit('clearChatRoom');

    activeRoom = await currentUser.subscribeToRoom({
        roomId,
        message_limit: MESSAGE_LIMIT,
        hooks: {
            onMessage: message => {
                store.commit('addMessage', {
                    name: message.sender.name,
                    username: message.senderId,
                    text: message.text,
                    date: moment(message.createdAt).format('h:mm:ss a D-MM-YYYY')
                });
            },
            onPresenceChanged: () => {
                setMembers();
            },
            onUserStartedTyping: user => {
                store.commit('setUserTyping', user.id)
            },
            onUserStoppedTyping: () => {
                store.commit('setUserTyping', null)
            }
        }
    });

    setMembers();

    return activeRoom
}

async function connectUser( userId ) {
    const chatManager = new ChatManager( {
        instanceLocator: INSTANCE_LOCATOR,
        tokenProvider: new TokenProvider( { url: TOKEN_URL } ),
        userId
    } );

    currentUser = await chatManager.connect();

    return currentUser;
}

export default {
    connectUser,
    subscribeToRoom
}