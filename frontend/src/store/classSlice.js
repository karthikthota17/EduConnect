import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosConfig';

export const fetchMyClasses = createAsyncThunk('classes/fetchMyClasses', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/classes');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch classes');
  }
});

export const createClass = createAsyncThunk('classes/createClass', async (classData, { rejectWithValue }) => {
  try {
    const response = await api.post('/classes', classData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create class');
  }
});

export const joinClass = createAsyncThunk('classes/joinClass', async (code, { rejectWithValue }) => {
  try {
    const response = await api.post('/classes/join', { code });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to join class');
  }
});

export const fetchClassDetails = createAsyncThunk('classes/fetchClassDetails', async (classId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/classes/${classId}`);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch class details');
  }
});

export const deleteClass = createAsyncThunk('classes/deleteClass', async (classId, { rejectWithValue }) => {
  try {
    await api.delete(`/classes/${classId}`);
    return classId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete class');
  }
});

const classSlice = createSlice({
  name: 'classes',
  initialState: {
    myClasses: [],
    activeClass: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearClassError: (state) => {
      state.error = null;
    },
    clearActiveClass: (state) => {
      state.activeClass = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyClasses.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchMyClasses.fulfilled, (state, action) => { state.isLoading = false; state.myClasses = action.payload; })
      .addCase(fetchMyClasses.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      
      .addCase(createClass.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(createClass.fulfilled, (state, action) => { state.isLoading = false; state.myClasses.push(action.payload); })
      .addCase(createClass.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      
      .addCase(joinClass.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(joinClass.fulfilled, (state, action) => { state.isLoading = false; state.myClasses.push(action.payload); })
      .addCase(joinClass.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(fetchClassDetails.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchClassDetails.fulfilled, (state, action) => { state.isLoading = false; state.activeClass = action.payload; })
      .addCase(fetchClassDetails.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(deleteClass.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(deleteClass.fulfilled, (state, action) => { 
        state.isLoading = false; 
        state.myClasses = state.myClasses.filter(c => c._id !== action.payload);
        if (state.activeClass?._id === action.payload) state.activeClass = null;
      })
      .addCase(deleteClass.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });
  }
});

export const { clearClassError, clearActiveClass } = classSlice.actions;
export default classSlice.reducer;
