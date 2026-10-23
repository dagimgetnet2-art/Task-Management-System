export function showError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

export function clearError(element) {
  element.textContent = "";
  element.hidden = true;
}
