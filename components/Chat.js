import React from 'react';
import { View, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { GiftedChat, Bubble} from 'react-native-gifted-chat';
import * as firebase from 'firebase';
import "firebase/firestore";


//const firebase = require('firebase');
//require('firebase/firestore');

export default class Chat extends React.Component {
  constructor() {
    super();
    this.state = {
      messages: [],
      uid: 0,
      user: {
        _id: "",
        name: "",
        avatar: "",
      }
    }

  //information for the database
  const firebaseConfig = {
    apiKey: "AIzaSyAv2hijpFZpCvkMTlxq0daqnbKjsu-NTgU",
    authDomain: "chat-app-aebaa.firebaseapp.com",
    projectId: "chat-app-aebaa",
    storageBucket: "chat-app-aebaa.appspot.com",
    messagingSenderId: "235131396707",
    appId: "1:235131396707:web:68ab69b96badf96bd44e56"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  //refernces the database
  this.referenceChatMessages = firebase.firestore().collection("messages");
  }

  componentDidMount() {
    let name = this.props.route.params.name;
    this.props.navigation.setOptions({ title: name });

    //auth
    this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        await firebase.auth().signInAnonymously();
      }
      this.setState({
        uid: user.uid,
        messages: [
          {
            _id: 1,
            text: 'Hello developer',
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'React Native',
              avatar: 'https://placeimg.com/140/140/any',
            },
          },
          {
            _id: 2,
            text: `${name} has entered the chat.`,
            createdAt: new Date(),
            system: true,
           },
        ],
        user: {
          _id: user.uid,
          name: name,
          avatar: 'https://placeimg.com/140/140/any'
      }
    });

    this.unsubscribe = this.referenceChatMessages
      .orderBy("createdAt", "desc")
      .onSnapshot(this.onCollectionUpdate);
    });
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // goes through each document
    querySnapshot.forEach((doc) => {
      // gets the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id, 
        createdAt: data.createdAt.toDate(),
        text: data.text,
        user: data.user,
      });
   });
};

  addMessage() {
    const message = this.state.messages[0];
    
    this.referenceChatMessages.add({
      _id: message._id,
      createdAt: message.createdAt,
      text: message.text,
      user: this.state.user
    });
  }

  onSend(messages = []) {
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }), () => {
      this.addMessage();
    })
  };

  componentWillUnmount() {
    this.authUnsubscribe();
    this.unsubscribe();
  }

  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#000'
          }
        }}
      />
    )
  }

  render() {
    const { Color } = this.props.route.params;

    return (
      <View style={{
        flex: 1, 
        justifyContent: 'center', 
        backgroundColor: Color
        }}>
        <GiftedChat
          renderBubble={this.renderBubble.bind(this)}
          messages={this.state.messages}
          onSend={messages => this.onSend(messages)}
          user={{
            _id: this.state.user._id,
            name: this.state.name,
            avatar: this.state.user.avatar
        }}
        />
        {Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null}
      </View>
    )
  }
}