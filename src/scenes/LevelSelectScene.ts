import Phaser from 'phaser';
import { EPISODES } from '../config/episodes';
import { CHARACTERS } from '../config/characters';
import { Save } from '../systems/Save';
import { Sfx } from '../systems/Sfx';
import { addMuteButton } from './ui';

/** Icon-only level picker. A level unlocks when the one before it is complete. */
export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor('#2a6f3b').fadeIn(200);

    addMuteButton(this, width - 48, 48);

    const { height } = this.scale;
    this.add
      .text(24, 32, `🐛 ${Save.bank}`, { fontSize: '34px', color: '#fff8e1', stroke: '#1d3b2a', strokeThickness: 6 })
      .setOrigin(0, 0.5);

    // Start over (small and out of the way; the next screen needs a deliberate hold).
    const reset = this.add
      .circle(48, height - 48, 30, 0x000000, 0.35)
      .setInteractive({ useHandCursor: true });
    this.add.text(48, height - 48, '🗑️', { fontSize: '30px' }).setOrigin(0.5).setAlpha(0.8);
    reset.on('pointerdown', () => {
      Sfx.play('ui');
      this.scene.start('Reset');
    });

    // Spend bugs on upgrades once an animal has hatched.
    if (Save.character) {
      const ready = Save.canAffordUpgrade();
      const up = this.add
        .circle(width - 190, height - 70, 52, ready ? 0xfff176 : 0xffffff, 0.92)
        .setStrokeStyle(6, ready ? 0xffa000 : 0xffd54f)
        .setInteractive({ useHandCursor: true });
      this.add.text(width - 190, height - 70, '⬆️', { fontSize: '56px' }).setOrigin(0.5);
      if (ready) this.tweens.add({ targets: up, scale: 1.12, duration: 500, yoyo: true, repeat: -1 });
      up.on('pointerdown', () => {
        Sfx.play('ui');
        this.scene.start('Upgrade', { returnTo: 'LevelSelect' });
      });
    }

    // Change character any time once hatched.
    if (Save.character) {
      const swap = this.add
        .circle(width - 70, height - 70, 52, 0xffffff, 0.92)
        .setStrokeStyle(6, 0xffd54f)
        .setInteractive({ useHandCursor: true });
      const pic = this.add.image(width - 70, height - 70, CHARACTERS[Save.character].texture);
      pic.setScale(Math.min(0.42, 70 / pic.width));
      this.add.text(width - 36, height - 30, '⇄', { fontSize: '30px', color: '#2a6f3b' }).setOrigin(0.5);
      swap.on('pointerdown', () => {
        Sfx.play('ui');
        this.scene.start('Characters', { overlay: false, returnTo: 'LevelSelect', canClose: true });
      });
    }

    let prevDone = true; // first level always open
    EPISODES.forEach((ep, row) => {
      const y = 140 + row * 190;
      const built = ep.levels.length > 0;
      const epUnlocked = built && prevDone;

      this.add.rectangle(width / 2, y, width - 80, 160, 0x000000, 0.25).setStrokeStyle(4, 0xffffff, 0.3);

      // Episode icon: shows the chosen character once hatched.
      if (ep.id > 1 && Save.character) {
        const pic = this.add.image(110, y, CHARACTERS[Save.character].texture);
        pic.setScale(Math.min(0.62, 90 / pic.width)).setAlpha(built ? 1 : 0.5);
      } else {
        this.add.text(110, y, ep.icon, { fontSize: '84px' }).setOrigin(0.5).setAlpha(built ? 1 : 0.5);
      }

      if (!built) {
        this.add.text(width / 2 + 40, y, '🔒', { fontSize: '64px' }).setOrigin(0.5);
        return;
      }

      ep.levels.forEach((id, i) => {
        const open = epUnlocked && (i === 0 || Save.isComplete(ep.levels[i - 1]));
        const x = 260 + i * 150;
        const btn = this.add
          .circle(x, y - 12, 52, open ? 0xffffff : 0x666666, open ? 0.95 : 0.6)
          .setStrokeStyle(6, open ? 0xffd54f : 0x444444);
        this.add
          .text(x, y - 12, open ? String(i + 1) : '🔒', {
            fontSize: open ? '60px' : '40px',
            color: '#2a6f3b',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);

        // Bugs found in this level, out of what's there.
        const total = ((this.cache.json.get(id)?.collectibles ?? []) as unknown[]).length;
        if (open && total) {
          this.add
            .text(x, y + 76, `🐛 ${Save.levelBugs(id).count}/${total}`, { fontSize: '20px', color: '#fff8e1' })
            .setOrigin(0.5);
        }

        const stars = Save.starsFor(id);
        for (let s = 0; s < 3; s++) {
          this.add
            .star(x + (s - 1) * 30, y + 54, 5, 6, 14, s < stars ? 0xffd54f : 0x555555)
            .setAlpha(open ? 1 : 0.4);
        }

        if (open) {
          btn.setInteractive({ useHandCursor: true });
          btn.on('pointerdown', () => {
            Sfx.play('ui');
            this.scene.start('Level', { levelId: id, formId: ep.form });
          });
        }
      });

      prevDone = ep.levels.every((id) => Save.isComplete(id)) && (ep.id !== 1 || !!Save.species);
    });
  }
}
