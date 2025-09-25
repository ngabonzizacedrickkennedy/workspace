"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User, UserProfile } from "@/types/user";
import { authService } from "@/services/authService";
import {
  profileService,
  ProfileSetupRequest,
  ProfileUpdateRequest,
  ProfileResponse,
} from "@/services/profileService";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    role?: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  setupProfile: (profileData: ProfileSetupRequest) => Promise<void>;
  updateProfile: (profileData: ProfileUpdateRequest) => Promise<void>;
  uploadProfileImage: (file: File) => Promise<string>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const userData = await authService.getCurrentUser();

      // CRITICAL FIX: Ensure userData has all required properties with safe defaults
      const completeUserData: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        profileCompleted: userData.profileCompleted || false,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        // SAFE: Set profile to undefined if null, rather than keeping null
        profile: userData.profile || undefined,
      };

      setUser(completeUserData);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Set token in axios defaults immediately
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Set up axios interceptors for authentication
  useEffect(() => {
    // Add token to requests
    const requestInterceptor = api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 unauthorized responses
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and user data on authentication errors
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
          setUser(null);

          // Only redirect if not already on an auth page
          const path = window.location.pathname;
          if (
            !path.includes("/login") &&
            !path.includes("/register") &&
            !path.includes("/forgot-password")
          ) {
            toast.error("Your session has expired. Please log in again.");
            router.push("/login");
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [router]);

  // CRITICAL FIX: Safe redirect path with null checks
  const getRedirectPath = (userData: User) => {
    console.log("Getting redirect path for user:", userData);

    // Admin users always go to admin dashboard
    if (userData.role === "ADMIN") {
      return "/admin";
    }

    // SAFE: Use profileCompleted flag instead of checking profile properties
    // This prevents the "Cannot read properties of null" error
    if (!userData.profileCompleted) {
      console.log("Profile not completed, redirecting to profile setup");
      return "/profile-setup";
    } else {
      console.log("Profile completed, redirecting to dashboard");
      return "/dashboard";
    }
  };

  // ENHANCED: Login function with better error handling and sequencing
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Step 1: Login and get token
      const response = await authService.login(email, password);

      // Step 2: Store the token immediately
      localStorage.setItem("token", response.token);

      // Step 3: Set authorization header for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${response.token}`;

      // Step 4: Fetch complete user data
      const userData = await authService.getCurrentUser();

      // Step 5: Create safe user object with defaults
      const completeUserData: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        profileCompleted: userData.profileCompleted || false,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        profile: userData.profile || undefined, // SAFE: undefined instead of null
      };

      // Step 6: Set user state
      setUser(completeUserData);

      toast.success("Successfully logged in");

      // Step 7: Determine redirect path and navigate
      const redirectPath = getRedirectPath(completeUserData);
      router.push(redirectPath);
    } catch (error) {
      console.error("Login failed:", error);
      // Clear any potentially set tokens on login failure
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      toast.error("Login failed. Please check your credentials.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    username: string,
    email: string,
    password: string,
    role = "CLIENT"
  ) => {
    try {
      setIsLoading(true);
      await authService.register({ username, email, password, role });
      toast.success("Registration successful! Please log in.");
      router.push("/login");
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    toast.info("You have been logged out");
    router.push("/login");
  };

  // Update user function
  const updateUser = async (userData: Partial<User>) => {
    if (!user) throw new Error("No user is logged in");

    try {
      setIsLoading(true);
      setUser((prevUser) => (prevUser ? { ...prevUser, ...userData } : null));
      toast.success("User updated successfully");
    } catch (error) {
      console.error("User update failed:", error);
      toast.error("Failed to update user");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Setup profile function
  const setupProfile = async (profileData: ProfileSetupRequest) => {
    try {
      setIsLoading(true);
      if (!user) throw new Error("No user is logged in");

      const updatedProfile = await profileService.setupProfile(profileData);

      // Update user with profile completed status
      const updatedUser: User = {
        ...user,
        profileCompleted: true,
        profile: updatedProfile as UserProfile,
      };

      setUser(updatedUser);
      toast.success("Profile setup completed successfully");

      // Redirect to appropriate page
      const redirectPath = getRedirectPath(updatedUser);
      router.push(redirectPath);
    } catch (error) {
      console.error("Profile setup failed:", error);
      toast.error("Failed to setup profile");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData: ProfileUpdateRequest) => {
    try {
      setIsLoading(true);
      if (!user) throw new Error("No user is logged in");

      const updatedProfile = await profileService.updateProfile(profileData);

      setUser((prevUser) =>
        prevUser
          ? {
              ...prevUser,
              profile: updatedProfile as UserProfile,
            }
          : null
      );

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Failed to update profile");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload profile image function
  const uploadProfileImage = async (file: File): Promise<string> => {
    try {
      setIsLoading(true);
      if (!user) throw new Error("No user is logged in");

      const response = await profileService.uploadProfilePicture(file);

      // Update user profile with new image URL
      setUser((prevUser) =>
        prevUser && prevUser.profile
          ? {
              ...prevUser,
              profile: {
                ...prevUser.profile,
                profilePictureUrl: response.profilePictureUrl,
              },
            }
          : prevUser
      );

      toast.success("Profile image updated successfully");
      return response.profilePictureUrl;
    } catch (error) {
      console.error("Profile image upload failed:", error);
      toast.error("Failed to upload profile image");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset functions
  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true);
      await authService.requestPasswordReset(email);
      toast.success("Password reset email sent");
    } catch (error) {
      console.error("Password reset request failed:", error);
      toast.error("Failed to send password reset email");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setIsLoading(true);
      await authService.resetPassword(token, password);
      toast.success("Password reset successful");
      router.push("/login");
    } catch (error) {
      console.error("Password reset failed:", error);
      toast.error("Failed to reset password");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      setIsLoading(true);
      await authService.updatePassword(currentPassword, newPassword);
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Password update failed:", error);
      toast.error("Failed to update password");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    setupProfile,
    updateProfile,
    uploadProfileImage,
    requestPasswordReset,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
