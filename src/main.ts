import App from './App'
import example from './data/example.json';
import exampleDebug from './data/example_test.json';
import exampleFis from './data/example_fis.json';
import exampleRock from './data/example_rock.json';
import exampleSoftDisco from './data/example_softdisco.json';
import { IFingerprint } from './types';

const container = document.getElementById('app');
let app: App|undefined;
if (container) {
  app = new App(container, exampleFis as unknown as IFingerprint);
}

const textarea = document.getElementById('fingerprint');
if (textarea) {
  textarea.textContent = JSON.stringify(example);
  textarea.addEventListener('change', (ev) => {
    if (app && container && textarea.textContent !== null) {
      app.dispose();
      app = new App(container, JSON.parse(textarea.textContent) as IFingerprint);
    }
  })
}

const lookup = {
  ['Example'] : example,
  ['Test'] : exampleDebug,
  ['Snare-y experimental'] : exampleFis,
  ['Rock'] : exampleRock,
  ['Disco-y'] : exampleSoftDisco,
}

document.querySelectorAll('.example-button').forEach(el => {
  el.addEventListener('click', (e) => {
    const d = lookup[el.innerHTML]
    if (textarea) {
      textarea.innerText = JSON.stringify(d);
      const event = new Event('change', { bubbles: true });
      textarea.dispatchEvent(event);
    }
  })
})
