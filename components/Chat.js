import React, { Component } from 'react';
import { View, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { GiftedChat, Bubble, InputToolbar} from 'react-native-gifted-chat';
import * as firebase from 'firebase';
import "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';
import CustomActions from './CustomActions';
import MapView from 'react-native-maps';


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
      },
      isConnected: false,
      image: null,
      location: null,
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

  // Retrieve messages from async storage
  async getMessages() {
    let messages = '';
    try {
      messages = await AsyncStorage.getItem('messages') || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  // Save messages to async storage
  async saveMessages() {
    try {
      await AsyncStorage.setItem('messages', 
        JSON.stringify(this.state.messages));
    } catch (error) {
      console.log(error.message);
    }
  }

  // Delete messages from async storage 
  async deleteMessages() {
    try {
      await AsyncStorage.removeItem('messages');
      this.setState({
        messages: []
      })
    } catch (error) {
      console.log(error.message);
    }
  }

  componentDidMount() {
    // Preloaded message to greet the developer
    // Second message saying the user has entered the chat by username
    let name = this.props.route.params.name;
    this.props.navigation.setOptions({ title: name });

    // checks users connection
    NetInfo.fetch().then(connection => {
      if (connection.isConnected) {
        console.log('online');
        // User Authentication
        this.authUnsubscribe = firebase
          .auth()
          .onAuthStateChanged(async (user) => {
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
            },
            isConnected: true,
          });
      
          this.unsubscribe = this.referenceChatMessages
            .orderBy("createdAt", "desc")
            .onSnapshot(this.onCollectionUpdate);
          });          
          this.saveMessages();
          } else {
            console.log('offline');

            // user is offline
            this.setState({ isConnected: false });
            //retrieve chat from asyncStorage
            this.getMessages();
          }
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
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar,
        },
        image: data.image || null,
        location: data.location || null,
      });
    });
    // set the messages 
    this.setState({
      messages: messages,
    });
    // save the messages
    this.saveMessages();
  };

  addMessage() {
    const message = this.state.messages[0];
    
    this.referenceChatMessages.add({
      _id: message._id,
      createdAt: message.createdAt,
      text: message.text,
      user: this.state.user,
      image: message.image || null,
      location: message.location || null,
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
    if (this.state.isConnected) {
      // stops listening to authentication
      this.authUnsubscribe();
      // stops listening for changes
      this.unsubscribe();
    }
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

  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
      return(
        <InputToolbar
        {...props}
        />
      );
    }
  }

  renderCustomView (props) {
    const { currentMessage } = props;
    if (currentMessage.location) {
      return (
          <MapView
            style={{width: 150,
              height: 100,
              borderRadius: 13,
              margin: 3}}
            region={{
              latitude: currentMessage.location.latitude,
              longitude: currentMessage.location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          />
      );
    }
    return null;
  }

  // displays the communication features
  renderCustomActions = (props) => {
    return <CustomActions {...props} />;
  };

  render() {
    //user selected background color from the start page
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
          renderInputToolbar={this.renderInputToolbar.bind(this)}
          renderActions={this.renderCustomActions}
          renderCustomView={this.renderCustomView}
          user={{
            _id: this.state.user._id,
            name: this.state.name,
            avatar: this.state.user.avatar,
        }}
        />
        {Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null}
      </View> 
    )
  }
}