import {configureStore} from '@reduxjs/toolkit'
import userReducer from '../features/user/userSlice.js'
import connectionsReducer from '../features/connection/connectionSlice.js'
import messagesReducer from '../features/messages/messagesSlice.js'


export const store=configureStore({
    reducer:{
        user:userReducer,
        connections:connectionsReducer,
        messages:messagesReducer
    }
})