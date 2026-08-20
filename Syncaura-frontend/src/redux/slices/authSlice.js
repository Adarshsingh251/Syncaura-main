import { createSlice } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUser,
  changePassword,
  refreshAccessToken,
  fetchUserProfile,
  updateUserProfile,
} from "../features/authThunks";

const storedToken = localStorage.getItem("accessToken") || localStorage.getItem("token");

const initialState = {
  user: null,
  token: storedToken,
  isLoading: false,
  error: null,
  isAuthenticated: !!storedToken,
  authChecking: true,
  profileLoading: false,
};
const getPhotoStorageKey = (user) => {
  if (!user) return null;
  const identifier = user.id || user._id || user.email || "default";
  return `profile_photo_${identifier}`;
};


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setCredentials(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("token", token);
      }
      const key = getPhotoStorageKey(user);
      if (key && state.user) {
        state.user.profilePic = localStorage.getItem(key);
      }
    },
    logout(state) {
      state.isLoading = true;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.authChecking = false;
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      state.isLoading = false;
    },
    updateFrontendProfilePhoto(state, action) {
      if (state.user) {
        const key = getPhotoStorageKey(state.user);
        if (key) {
          if (action.payload) {
            localStorage.setItem(key, action.payload);
            state.user.profilePic = action.payload;
          } else {
            localStorage.removeItem(key);
            state.user.profilePic = null;
          }
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Register User
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const { user, tokens } = action.payload;
        state.user = user;
        state.token = tokens.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        const key = getPhotoStorageKey(user);
        if (key) state.user.profilePic = localStorage.getItem(key);
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Login User
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const { user, tokens } = action.payload;
        state.user = user;
        state.token = tokens.accessToken;
        state.isAuthenticated = true;

        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        const key = getPhotoStorageKey(user);
        if (key) state.user.profilePic = localStorage.getItem(key);
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(refreshAccessToken.pending, (state) => {
        state.authChecking = true;
        state.isLoading = true;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.authChecking = false;
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
      })

      // User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
    state.profileLoading = false;

    const profile =
      action.payload?.user ||
      action.payload?.data ||
      action.payload;

    state.user = profile;
    state.authChecking = false;  
    if (state.user) {
    const key = getPhotoStorageKey(profile);
    if (key) {
      state.user.profilePic = localStorage.getItem(key); // Restores your image string instantly!
    }
  } 
})
     .addCase(fetchUserProfile.rejected, (state) => {
    state.profileLoading = false;
    state.authChecking = false;
})
      .addCase(updateUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        const profile = action.payload?.user || action.payload?.data || action.payload;
        state.user = {
          ...state.user,
          ...profile,
        };
        const key = getPhotoStorageKey(state.user);
        if (key && state.user) {
          state.user.profilePic = localStorage.getItem(key);
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      })


      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        // Password changed successfully, no need to update user data
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAuthError, setCredentials, logout, updateFrontendProfilePhoto } = authSlice.actions;
export default authSlice.reducer;
