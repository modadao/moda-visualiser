import { GUI } from 'dat.gui';
import { Controller } from 'lil-gui';

export default class GradientController extends Controller {
  $canvas: HTMLCanvasElement;
  $ctx: CanvasRenderingContext2D;
  constructor ( parent: GUI, object: Object, property: string) {
    super( parent, object, property, 'gradient');
    this.$canvas = document.createElement('canvas');
    this.$canvas.style.width = `100%`;
    this.$canvas.style.height = `20px`;
    this.$ctx = this.$canvas.getContext('2d') as CanvasRenderingContext2D;

    const container = document.createElement('div');
    this.$widget.appendChild(container);
    container.appendChild( this.$canvas );

    this.resizeCanvas();
    this.updateCanvas();
  }

  private updateCanvas() {
    var grd = this.$ctx.createLinearGradient(0, 0, 200, 0);
    grd.addColorStop(0, "red");
    grd.addColorStop(1, "white");
    this.$ctx.fillStyle = grd;
    this.$ctx.fillRect(0, 0, 150, 80);
  }

  private resizeCanvas() {
    const bounds = this.$widget.getBoundingClientRect();
    this.$canvas.width = bounds.width;
    this.$canvas.height = bounds.height;
  }
}