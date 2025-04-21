document.addEventListener('DOMContentLoaded', () => {
  const openaiInput = document.getElementById('openaiKey');
  const modelSelect = document.getElementById('model');
  const autoToggleCheckbox = document.getElementById('autoToggle');
  const saveButton = document.getElementById('save');

  // Load saved values
  chrome.storage.sync.get(['OPENAI_API_KEY', 'MODEL', 'AUTO_TOGGLE'], (data) => {
    if (data.OPENAI_API_KEY) openaiInput.value = data.OPENAI_API_KEY;
    if (data.MODEL) modelSelect.value = data.MODEL;
    if (data.AUTO_TOGGLE) autoToggleCheckbox.checked = true;
  });

  // Save on click
  saveButton.addEventListener('click', () => {
    const openaiKey = openaiInput.value.trim();
    const model = modelSelect.value;
    const autoToggle = autoToggleCheckbox.checked;
    chrome.storage.sync.set({
      OPENAI_API_KEY: openaiKey,
      MODEL: model,
      AUTO_TOGGLE: autoToggle
    }, () => {
      saveButton.textContent = 'Saved ✅';
      setTimeout(() => saveButton.textContent = 'Save', 2000);
    });
  });
});
