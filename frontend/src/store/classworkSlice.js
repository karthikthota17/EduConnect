import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosConfig';

export const fetchClasswork = createAsyncThunk('classwork/fetch', async (classId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/classwork/${classId}`);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch classwork');
  }
});

// We use FormData for materials and assignments
export const createMaterial = createAsyncThunk('classwork/createMaterial', async ({classId, formData}, { rejectWithValue }) => {
  try {
    const response = await api.post(`/classwork/${classId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create material');
  }
});

export const createAssignment = createAsyncThunk('classwork/createAssignment', async ({classId, formData}, { rejectWithValue }) => {
  try {
    const response = await api.post(`/classwork/${classId}/assignments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create assignment');
  }
});

export const createQuiz = createAsyncThunk('classwork/createQuiz', async ({classId, quizData}, { rejectWithValue }) => {
  try {
    const response = await api.post(`/classwork/${classId}/quizzes`, quizData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create quiz');
  }
});

export const updateQuiz = createAsyncThunk('classwork/updateQuiz', async ({classId, quizId, quizData}, { rejectWithValue }) => {
  try {
    const response = await api.put(`/classwork/${classId}/quizzes/${quizId}`, quizData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update quiz');
  }
});

export const deleteMaterial = createAsyncThunk('classwork/deleteMaterial', async ({classId, materialId}, { rejectWithValue }) => {
  try {
    await api.delete(`/classwork/${classId}/materials/${materialId}`);
    return materialId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete material');
  }
});

export const deleteAssignment = createAsyncThunk('classwork/deleteAssignment', async ({classId, assignmentId}, { rejectWithValue }) => {
  try {
    await api.delete(`/classwork/${classId}/assignments/${assignmentId}`);
    return assignmentId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete assignment');
  }
});

export const deleteQuiz = createAsyncThunk('classwork/deleteQuiz', async ({classId, quizId}, { rejectWithValue }) => {
  try {
    await api.delete(`/classwork/${classId}/quizzes/${quizId}`);
    return quizId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete quiz');
  }
});

export const deleteAnnouncement = createAsyncThunk('classwork/deleteAnnouncement', async ({classId, announcementId}, { rejectWithValue }) => {
  try {
    await api.delete(`/classwork/${classId}/announcements/${announcementId}`);
    return announcementId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete announcement');
  }
});

const classworkSlice = createSlice({
  name: 'classwork',
  initialState: {
    materials: [],
    assignments: [],
    quizzes: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClasswork.pending, (state) => { state.isLoading = true; })
      .addCase(fetchClasswork.fulfilled, (state, action) => {
        state.isLoading = false;
        state.materials = action.payload.materials;
        state.assignments = action.payload.assignments;
        state.quizzes = action.payload.quizzes;
      })
      .addCase(fetchClasswork.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      .addCase(createMaterial.fulfilled, (state, action) => {
        state.materials.unshift(action.payload);
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.assignments.unshift(action.payload);
      })
      .addCase(createQuiz.fulfilled, (state, action) => {
        state.quizzes.unshift(action.payload);
      })
      .addCase(updateQuiz.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateQuiz.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.quizzes.findIndex(q => q._id === action.payload._id);
        if (index !== -1) state.quizzes[index] = action.payload;
      })
      .addCase(updateQuiz.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.materials = state.materials.filter(m => m._id !== action.payload);
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.assignments = state.assignments.filter(a => a._id !== action.payload);
      })
      .addCase(deleteQuiz.fulfilled, (state, action) => {
        state.quizzes = state.quizzes.filter(q => q._id !== action.payload);
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        // Announcements are currently managed in ClassDetails local state,
        // but we add this for structural completeness.
        state.isLoading = false;
      });
  }
});

export default classworkSlice.reducer;
