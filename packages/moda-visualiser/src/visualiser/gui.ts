import gui from 'lil-gui'

const myGui = new gui({
  autoPlace: true,
});

export default myGui
export const components = myGui.addFolder('Components');
export const fftControls = myGui.addFolder('FFT Controls').close();
export const fftSpringControls = myGui.addFolder('Sphere Spring controls').close();
export const bezierSpringControls = myGui.addFolder('Bezier Spring controls').close();
export const bezierControls = myGui.addFolder('Bezier Noise Controls').close();

export const ringsControls = myGui.addFolder('RingsControls').close();
// if (import.meta && import.meta.hot !== undefined) {
//   import.meta.hot.dispose(() => {
//     myGui.destroy();
//     myGui.domElement.parentElement?.removeChild(myGui.domElement);
//   })
// }
