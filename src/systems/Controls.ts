import Phaser from 'phaser';

/** Unified input state, written by keyboard and touch, read by the player. */
export interface ControlState {
  left: boolean;
  right: boolean;
  jump: boolean;
  action: boolean;
}

const W = 960;
const H = 540;

/** Keyboard + on-screen touch buttons feeding one ControlState. */
export class Controls {
  readonly state: ControlState = { left: false, right: false, jump: false, action: false };
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private touch: ControlState = { left: false, right: false, jump: false, action: false };

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (kb) {
      this.keys = kb.addKeys('LEFT,RIGHT,UP,SPACE,A,D,W,X,Z') as Record<string, Phaser.Input.Keyboard.Key>;
    }
    const wantTouch =
      scene.sys.game.device.input.touch || new URLSearchParams(location.search).has('touch');
    if (wantTouch) this.buildTouch(scene);
  }

  private buildTouch(scene: Phaser.Scene) {
    scene.input.addPointer(3); // multi-touch: move + jump together
    const pad = (x: number, y: number, r: number, label: string, key: keyof ControlState) => {
      const c = scene.add
        .circle(x, y, r, 0xffffff, 0.28)
        .setStrokeStyle(4, 0xffffff, 0.6)
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive();
      scene.add
        .text(x, y, label, { fontSize: `${r}px` })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);
      const set = (v: boolean) => {
        this.touch[key] = v;
        c.setFillStyle(0xffffff, v ? 0.5 : 0.28);
      };
      c.on('pointerdown', () => set(true));
      c.on('pointerup', () => set(false));
      c.on('pointerout', () => set(false));
    };
    pad(90, H - 80, 62, '◀', 'left');
    pad(250, H - 80, 62, '▶', 'right');
    pad(W - 90, H - 80, 62, '⬆', 'jump');
    pad(W - 250, H - 80, 62, '💥', 'action');
  }

  update() {
    const k = this.keys;
    const down = (...ks: string[]) => ks.some((n) => k[n]?.isDown);
    this.state.left = this.touch.left || down('LEFT', 'A');
    this.state.right = this.touch.right || down('RIGHT', 'D');
    this.state.jump = this.touch.jump || down('UP', 'W', 'SPACE');
    this.state.action = this.touch.action || down('X', 'Z');
  }
}
