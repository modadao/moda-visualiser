import App from './App'
import example from './data/example.json';
import exampleDebug from './data/example_test.json';
import exampleFis from './data/example_fis.json';
import exampleRock from './data/example_rock.json';
import exampleSoftDisco from './data/example_softdisco.json';
import { IFingerprint } from './types';
import gui from './helpers/gui';

const container = document.getElementById('app');

export interface ISettings {
  featurePoints: {
    count: number,
    extraPer: number,
  },
  update: () => void,
}
const settings: ISettings = {
  featurePoints: {
    count: 7,
    extraPer: 3000,
  },
  update: () => {
    if (app && container && lastContent) {
      app.dispose();
      app = new App(container, lastContent, settings)
    }
  }
}

const featurePoints = gui.addFolder('FeaturePoints');
featurePoints.add(settings.featurePoints, 'count', 0, 15, 1);
featurePoints.add(settings.featurePoints, 'extraPer', 200, 5000, 1);
gui.add(settings, 'update');


let lastContent: undefined|IFingerprint;
const textarea = document.getElementById('fingerprint');
if (textarea) {
  textarea.textContent = JSON.stringify(example);
  textarea.addEventListener('change', (ev) => {
    if (app && container && textarea.textContent !== null) {
      lastContent = JSON.parse(textarea.textContent) as IFingerprint;
      app.dispose();
      app = new App(container, lastContent, settings);
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
let app: App|undefined;
if (container) {
  lastContent = exampleFis as unknown as IFingerprint;
  app = new App(container, lastContent, settings);
}
