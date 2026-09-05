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
// A simplified, illustrative collection with no connection to the app's library.
const sampleDevices = JSON.parse(document.getElementById('sample-data').textContent);
const sampleSearch = document.getElementById('sample-search');
const sampleButtons = [...document.querySelectorAll('[data-device]')];
const setSampleText = (id, text) => { document.getElementById(id).textContent = text; };
function selectSampleDevice(id) {
  const device = sampleDevices.find(item => item.id === id);
  if (!device) return;
  sampleButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.device === id)));
  ['name', 'subtitle', 'category', 'installed', 'latest', 'chip', 'color', 'note', 'identifier', 'model', 'build', 'latestBuild', 'beta', 'betaBuild', 'condition', 'location'].forEach(key => setSampleText(`sample-${key}`, device[key]));
  document.getElementById('sample-beta-row').hidden = !device.beta;
  const image = document.getElementById('sample-image');
  image.src = `/hoardware/devices/${device.id}.svg`;
  image.alt = `${device.name} illustration`;
  document.getElementById('sample-portrait').className = `sample-portrait ${device.id}`;
  const status = document.getElementById('sample-status');
  status.classList.toggle('has-update', device.update);
  status.textContent = device.update ? '↓ Update available' : '✓ Up to date';
  document.getElementById('sample-detail').setAttribute('aria-label', `${device.name} sample details`);
}
sampleButtons.forEach(button => button.addEventListener('click', () => selectSampleDevice(button.dataset.device)));
sampleSearch.addEventListener('input', () => {
  const query = sampleSearch.value.trim().toLowerCase();
  const matches = sampleDevices.filter(device => [device.name, device.category, device.chip, device.subtitle, device.identifier, device.model, device.installed].join(' ').toLowerCase().includes(query));
  sampleButtons.forEach(button => { button.hidden = !matches.some(device => device.id === button.dataset.device); });
  document.querySelectorAll('.sample-group').forEach(group => {
    const count = [...group.querySelectorAll('[data-device]')].filter(button => !button.hidden).length;
    group.hidden = count === 0;
    group.querySelector('h4 span').textContent = `(${count})`;
  });
  document.getElementById('sample-empty').hidden = matches.length > 0;
  setSampleText('sample-count', `${matches.length} ${matches.length === 1 ? 'device' : 'devices'}${query ? ' found' : ' · A few favorites'}`);
});
