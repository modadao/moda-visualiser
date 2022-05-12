import gui from 'lil-gui'

const myGui = new gui({
  autoPlace: true,
});

export default myGui
export const components = myGui.addFolder('Components')
