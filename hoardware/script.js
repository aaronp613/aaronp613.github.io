const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
function updateTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  document.getElementById('theme-color').content = theme === 'dark' ? '#090b10' : '#fbfbfd';
}
updateTheme(root.dataset.theme);
themeToggle.addEventListener('click', () => {
  const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  updateTheme(theme);
  try { localStorage.setItem('theme', theme); } catch { /* Theme still works without storage. */ }
});
systemTheme.addEventListener('change', event => {
  try { if (localStorage.getItem('theme')) return; } catch { /* Follow the system if storage is unavailable. */ }
  updateTheme(event.matches ? 'dark' : 'light');
});
window.addEventListener('storage', event => {
  if (event.key === 'theme') updateTheme(event.newValue === 'dark' || (!event.newValue && systemTheme.matches) ? 'dark' : 'light');
});
