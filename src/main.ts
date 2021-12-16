import App from './App'
import example from './data/example.json';
import exampleDebug from './data/example_test.json';
import exampleFis from './data/example_fis.json';
import exampleRock from './data/example_rock.json';
import exampleSoftDisco from './data/example_softdisco.json';
import exampleAbientTechno from './data/example_ambient_techno.json';
import { IFingerprint } from './types';
import gui from './helpers/gui';

const container = document.getElementById('app');

export interface ISettings {
  points: {
    outlineSize: number,
    outlineMultiplier: number,
    outlineAdd: number,
    innerGlow: number,
  }
  featurePoints: {
    count: number,
    extraPer: number,
    sizeSmall: number,
    sizeMed: number,
    sizeMdLg: number,
    sizeLarge: number,
  },
  color: {
    baseVariation: number,
    velocityVariation: number,
  },
  beziers: {
    flareOut: number,
    flareIn: number,
    angleRandomness: number,
    verticalAngleRandomness: number,
    verticalIncidence: boolean,
  },
  sceneElements: {
    galaxyPoints: boolean,
    outlines: boolean,
    circumferenceGraph: boolean,
    mainBezier: boolean,
    extraBeziers: boolean,
    rings: boolean,
    flags: boolean,
    reflection: boolean,
  },
  update: () => void,
}
const settings: ISettings = {
  points: {
    outlineSize: 0.007,
    outlineAdd: 0.65,
    outlineMultiplier: 1,
    innerGlow: 1,
  },
  featurePoints: {
    count: 7,
    extraPer: 3000,
    sizeSmall: 0.15,
    sizeMed: 0.2,
    sizeMdLg: 0.3,
    sizeLarge: 0.5,
  },
  color: {
    baseVariation: 0.2,
    velocityVariation: 0.3,
  },
  beziers: {
    flareOut: 2.5,
    flareIn: 0.5,
    angleRandomness: 1,
    verticalAngleRandomness: 1,
    verticalIncidence: false,
  },
  sceneElements: {
    galaxyPoints: false,
    outlines: true,
    circumferenceGraph: true,
    mainBezier: true,
    extraBeziers: false,
    rings: true,
    flags: false,
    reflection: false,
  },
  update: () => {
    if (app && container && lastContent) {
      app.refresh(lastContent, settings);
    }
  }
}

const points = gui.addFolder('FeaturePoints');
points.add(settings.points, 'outlineSize', 0, 0.05, 0.001);
points.add(settings.points, 'outlineMultiplier', 0, 4, 0.01);
points.add(settings.points, 'outlineAdd', -1, 1, 0.01);
points.add(settings.points, 'innerGlow', 0, 2, 0.01);

const featurePoints = gui.addFolder('FeaturePoints');
featurePoints.add(settings.featurePoints, 'count', 0, 15, 1);
featurePoints.add(settings.featurePoints, 'extraPer', 200, 5000, 1);
featurePoints.add(settings.featurePoints, 'sizeSmall', 0, 1, 0.01);
featurePoints.add(settings.featurePoints, 'sizeMed', 0, 1, 0.01);
featurePoints.add(settings.featurePoints, 'sizeMdLg', 0, 1, 0.01);
featurePoints.add(settings.featurePoints, 'sizeLarge', 0, 1, 0.01);

const colorFolder = gui.addFolder('Color');
colorFolder.add(settings.color, 'baseVariation', 0, 1, 0.01);
colorFolder.add(settings.color, 'velocityVariation', 0, 1, 0.01);

const bezierFolder = gui.addFolder('Beziers');
bezierFolder.add(settings.beziers, 'flareOut', 0, 5, 0.01);
bezierFolder.add(settings.beziers, 'flareIn', 0, 1, 0.01);
bezierFolder.add(settings.beziers, 'angleRandomness', 0, 5, 0.01);
bezierFolder.add(settings.beziers, 'verticalAngleRandomness', 0, 5, 0.01);
bezierFolder.add(settings.beziers, 'verticalIncidence', 0, 5, 0.01);

let changeTimeout: number|undefined;
const handleSettingsChange = () => {
  if (changeTimeout) clearTimeout(changeTimeout);
  changeTimeout = setTimeout(() => {
    settings.update()
  }, 50);
}

points.onChange(handleSettingsChange);
bezierFolder.onChange(handleSettingsChange);
colorFolder.onChange(handleSettingsChange);
featurePoints.onChange(handleSettingsChange);

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
  ['Snare-y experimental'] : exampleFis,
  ['Rock'] : exampleRock,
  ['Disco-y'] : exampleSoftDisco,
  ['Ambient Techno'] : exampleAbientTechno,
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
  lastContent = exampleAbientTechno as unknown as IFingerprint;
  app = new App(container, lastContent, settings);
}
