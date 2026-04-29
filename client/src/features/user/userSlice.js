import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

const initialState = {
    value: null

}

export const fetchUser = createAsyncThunk('user/fetchUser', async (token) => {
    const response = await api.get('/api/user/data', {
        headers: { Authorization: `Bearer ${token}` }
    })

    return response.data.success ? response.data.user : null
})

export const updateUser = createAsyncThunk('user/update', async ({ userData, token }) => {
    const response = await api.post('/api/user/update', userData, {
        headers: { Authorization: `Bearer ${token}` }
    })

    if (response.data.success) {
        toast.success(response.data.message)
        return response.data.user
    } else {
        toast.error(response.data.message)
        return null
    }
})

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {
        builder.addCase(fetchUser.fulfilled, (state, action) => {
            state.value = action.payload
        }).addCase(updateUser.fulfilled, (state, action) => {
            state.value = action.payload
        })
    }
})

export default userSlice.reducer
