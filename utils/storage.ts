import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Store all auth data
export async function storeAuthData(token: string, user: any) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save auth data to storage', error);
  }
}

// Get the auth token
export async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to fetch token from storage', error);
    return null;
  }
}

// Get the user data
export async function getUser() {
  try {
    const userStr = await SecureStore.getItemAsync(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to fetch user from storage', error);
    return null;
  }
}

// Clear all auth data
export async function clearAuthData() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Failed to clear auth data from storage', error);
  }
} 