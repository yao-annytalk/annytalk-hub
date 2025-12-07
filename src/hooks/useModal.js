import { useModalContext } from '../context/ModalContext';

export const useModal = () => {
  const context = useModalContext();
  
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }

  const { openModal } = context;

  // 1. CONFIRM DIALOG
  const confirm = async ({ title = "Confirm Action", message = "Are you sure?", confirmText = "Confirm", cancelText = "Cancel", isDanger = false }) => {
    const result = await openModal({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      isDanger
    });
    return result.isConfirmed;
  };

  // 2. ALERT DIALOG
  const alert = async ({ title = "Notification", message, confirmText = "OK", type = "info" }) => {
    // Map 'type' to icon logic if needed, here passing simple success flag
    const isSuccess = type === 'success';
    
    await openModal({
      type: isSuccess ? 'success' : 'alert',
      title,
      message,
      confirmText
    });
    return true;
  };

  // 3. PROMPT DIALOG
  const prompt = async ({ title = "Enter Value", message = "", placeholder = "", confirmText = "Submit", cancelText = "Cancel", inputType = "text" }) => {
    const result = await openModal({
      type: 'prompt',
      title,
      message,
      inputPlaceholder: placeholder,
      confirmText,
      cancelText,
      inputType
    });
    if (result.isConfirmed) return result.value;
    return null; // Return null if cancelled
  };

  return { confirm, alert, prompt };
};