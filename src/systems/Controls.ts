import Phaser from 'phaser';

/** Unified input state, written by keyboard and touch, read by the player. */
export interface ControlState {
  left: boolean;
  right: boolean;
  /** Jump on land; swim up in water. */
  jump: boolean;
  /** Swim down (water levels only). */
  down: boolean;
  action: boolean;
}

const NONE: ControlState = { left: false, right: false, jump: false, down: false, action: false };

/** Keyboard + on-screen touch buttons feeding one ControlState. */
export class Controls {
  readonly state: ControlState = { ...NONE };
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  /** Set by the level; dims the on-screen action button while the attack is cooling down. */
  actionReady = true;
  private actionPad: Phaser.GameObjects.GameObject[] = [];
  private actionLabel?: Phaser.GameObjects.Text;
  private pendingIcon = '💥';
  private touch: ControlState = { ...NONE };
  private water: boolean;

  constructor(scene: Phaser.Scene, opts: { water?: boolean } = {}) {
    this.water = !!opts.water;
    const kb = scene.input.keyboard;
    if (kb) {
      this.keys = kb.addKeys('LEFT,RIGHT,UP,DOWN,SPACE,A,D,W,S,X,Z') as Record<string, Phaser.Input.Keyboard.Key>;
    }
    const wantTouch =
      scene.sys.game.device.input.touch || new URLSearchParams(location.search).has('touch');
    if (wantTouch) this.buildTouch(scene);
  }

  private buildTouch(scene: Phaser.Scene) {
    scene.input.addPointer(3); // multi-touch: move + jump together
    const W = scene.scale.width;
    const H = scene.scale.height;
    const pad = (x: number, y: number, r: number, label: string, key: keyof ControlState) => {
      const c = scene.add
        .circle(x, y, r, 0xffffff, 0.28)
        .setStrokeStyle(4, 0xffffff, 0.6)
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive();
      const label2 = scene.add
        .text(x, y, label, { fontSize: `${r}px` })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);
      if (key === 'action') {
        this.actionPad = [c, label2];
        this.actionLabel = label2.setText(this.pendingIcon);
      }
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
    if (this.water) {
      // Swimming: up and down stacked on the right, the ability beside them.
      pad(W - 90, H - 215, 62, '⬆', 'jump');
      pad(W - 90, H - 80, 62, '⬇', 'down');
    } else {
      pad(W - 90, H - 80, 62, '⬆', 'jump');
    }
    pad(W - 250, H - 80, 62, '💥', 'action');
  }

  /** The action button shows the current character's ability. */
  setActionIcon(icon: string) {
    this.pendingIcon = icon;
    this.actionLabel?.setText(icon);
  }

  /** Release any held touch buttons (e.g. after the level was paused under an overlay). */
  reset() {
    this.touch = { ...NONE };
  }

  update() {
    for (const o of this.actionPad) (o as Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.GameObject).setAlpha?.(this.actionReady ? 1 : 0.35);
    const k = this.keys;
    const down = (...ks: string[]) => ks.some((n) => k[n]?.isDown);
    this.state.left = this.touch.left || down('LEFT', 'A');
    this.state.right = this.touch.right || down('RIGHT', 'D');
    this.state.jump = this.touch.jump || down('UP', 'W', 'SPACE');
    this.state.down = this.touch.down || down('DOWN', 'S');
    this.state.action = this.touch.action || down('X', 'Z');
  }
}
