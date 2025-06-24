import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Store all auth data
export async function storeAuthData(token: string, user: any) {
  try {
    console.log('Storing auth data - Token:', token.substring(0, 10) + '...', 'User ID:', user.id);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    console.log('Auth data stored successfully');
  } catch (error) {
    console.error('Failed to save auth data to storage', error);
  }
}

// Get the auth token
export async function getToken() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    console.log('Retrieved token:', token ? token.substring(0, 10) + '...' : 'null');
    return token;
  } catch (error) {
    console.error('Failed to fetch token from storage', error);
    return null;
  }
}

// Get the user data
export async function getUser() {
  try {
    const userStr = await SecureStore.getItemAsync(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('Retrieved user data:', user ? { id: user.id, name: user.name } : 'null');
    return user;
  } catch (error) {
    console.error('Failed to fetch user from storage', error);
    return null;
  }
}

// Clear all auth data
export async function clearAuthData() {
  try {
    console.log('Clearing auth data from storage');
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Failed to clear auth data from storage', error);
  }
} 