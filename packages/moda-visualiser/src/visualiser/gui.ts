import gui from 'lil-gui'

const myGui = new gui({
  autoPlace: true,
});

export default myGui
export const components = myGui.addFolder('Components');
export const fftControls = myGui.addFolder('FFT Controls');
export const fftSpringControls = myGui.addFolder('Sphere Spring controls');
export const bezierSpringControls = myGui.addFolder('Bezier Spring controls');
export const bezierControls = myGui.addFolder('Bezier Noise Controls');

// if (import.meta && import.meta.hot !== undefined) {
//   import.meta.hot.dispose(() => {
//     myGui.destroy();
//     myGui.domElement.parentElement?.removeChild(myGui.domElement);
//   })
// }
