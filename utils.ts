
import { ToastMessage } from './types';

/**
 * Parses an error from the Gemini API and displays a user-friendly toast message.
 * @param error The error object caught from a try-catch block.
 * @param addToast The function to call to display a toast notification.
 */
export const handleApiError = (
  error: unknown,
  addToast: (message: string, type?: ToastMessage['type']) => void,
) => {
  console.error("AI Service Error:", error);

  let userMessage = "An unexpected error occurred. Please try again later.";
  const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();
  
  // Check for conditions that relate to API key or quota
  const isInvalidKeyError = errorMessage.includes('requested entity was not found') || errorMessage.includes('api key not valid');
  const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('rate limit');

  if (isInvalidKeyError) {
    addToast("Your API key appears to be invalid. Please check your configuration.", "error");
    return;
  }
  
  if (isQuotaError) {
    addToast("API rate limit or quota exceeded. Please check your billing and try again later.", "error");
    return;
  }
  
  // Handle other types of errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
    userMessage = "Network Error: Could not connect to the AI service. Please check your internet connection.";
  } else if (errorMessage.includes('timeout')) {
    userMessage = "The request to the AI service timed out. The service may be busy.";
  } else {
     try {
      // Attempt to parse a more specific error message from the response body
      const jsonStringMatch = errorMessage.match(/{.*}/s);
      if (jsonStringMatch) {
          const errorJson = JSON.parse(jsonStringMatch[0]);
          const apiError = errorJson.error || errorJson;
          if (apiError.message) {
              // Clean up the message for better readability
              userMessage = apiError.message.split(' [')[0] + '.';
          }
      } else {
        // Fallback for non-JSON errors
        userMessage = "An error occurred during AI processing. Please check the console for details.";
      }
    } catch(e) {
      // If parsing fails, use a generic message
      userMessage = "An unexpected error occurred while processing the AI response.";
    }
  }
  
  addToast(userMessage, 'error');
};
