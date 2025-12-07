export async function alert(message, title='Alert') {
  if (typeof window !== 'undefined' && window.__APP_OPEN_MODAL__) {
    const res = await window.__APP_OPEN_MODAL__({ type: 'alert', title, message, confirmText: 'OK' });
    return res;
  } else {
    // fallback
    return Promise.resolve({ isConfirmed: true });
  }
}

export async function confirm(message, title='Confirm') {
  if (typeof window !== 'undefined' && window.__APP_OPEN_MODAL__) {
    const res = await window.__APP_OPEN_MODAL__({ type: 'confirm', title, message, confirmText: 'Confirm', cancelText: 'Cancel' });
    return res.isConfirmed;
  } else {
    return Promise.resolve(window.confirm(message));
  }
}

export async function prompt(message, placeholder='', title='Input') {
  if (typeof window !== 'undefined' && window.__APP_OPEN_MODAL__) {
    const res = await window.__APP_OPEN_MODAL__({ type: 'prompt', title, message, inputPlaceholder: placeholder, confirmText: 'OK', cancelText: 'Cancel' });
    if (res.isConfirmed) return res.value;
    return null;
  } else {
    return Promise.resolve(window.prompt(message));
  }
}
